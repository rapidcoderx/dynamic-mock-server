// Initialize OpenTelemetry before any other imports (if enabled)
require('dotenv').config();
let otelSDK = null;
let shutdownTracing = null;
if (process.env.ENABLE_OTEL === 'true') {
    const { initializeTracing, shutdownTracing: shutdown } = require('./tracer');
    otelSDK = initializeTracing();
    shutdownTracing = shutdown;
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const { applySecurity } = require('./security');
const logger = require('./logger');
const { router: mockRoutes, mockStore } = require('./routes/mockRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { trackRequest } = require('./middleware/analytics');
let metricsRoutes, metricsMiddleware, trackMockConfigChange, trackMockError;
if (process.env.ENABLE_OTEL === 'true') {
    metricsRoutes = require('./routes/metricsRoutes');
    const metrics = require('./middleware/metrics');
    metricsMiddleware = metrics.metricsMiddleware;
    trackMockConfigChange = metrics.trackMockConfigChange;
    trackMockError = metrics.trackMockError;
}
const { findMock } = require('../utils/matcher');
const { loadMocks, closeStorage, getStorageInfo } = require('../utils/storageStrategy');
const dynamicResponse = require('../utils/dynamicResponse');
const { specs, swaggerServe, swaggerSetup } = require('./swagger');

/**
 * Dynamic Mock Server
 * 
 * Features:
 * - Intelligent log filtering: Suppresses noise from dev tools and browser requests
 * - Set LOG_DEV_REQUESTS=true to see filtered requests in debug mode
 * - Mock management with CRUD operations
 * - Header-based routing support
 */

const app = express();
const PORT = process.env.PORT || 8080;
const API_PREFIX = (process.env.API_PREFIX || '/api').replace(/\/$/, '');

// Initialize server
async function startServer() {
    logger.info(`Starting server with API prefix: ${API_PREFIX}`);
    
    app.use(express.json());
    app.use(cors());
    applySecurity(app);
    
    // Add metrics collection middleware (before analytics) - only if OpenTelemetry is enabled
    if (process.env.ENABLE_OTEL === 'true') {
        app.use(metricsMiddleware);
    }
    
    // Add analytics tracking middleware
    app.use(trackRequest);

    // Load mocks from configured storage
    try {
        const mocks = await loadMocks();
        mockStore.push(...mocks);
        
        const storageInfo = getStorageInfo();
        logger.info(`📦 Loaded ${mocks.length} mocks using ${storageInfo.type} storage`);
        
        // Update metrics with initial mock count (if OpenTelemetry is enabled)
        if (trackMockConfigChange) {
            trackMockConfigChange(mockStore);
        }
    } catch (err) {
        logger.error('❌ Failed to load mocks:', err.message);
        logger.warn('⚠️ Starting with empty mock store');
    }

    // Serve static files under the prefix
    app.use(`${API_PREFIX}/`, express.static(path.join(__dirname, '..', 'public')));

    // Swagger API Documentation
    app.use(`${API_PREFIX}/docs`, swaggerServe, swaggerSetup);
    app.use(`${API_PREFIX}/swagger`, swaggerServe, swaggerSetup); // Alternative path

    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Health check endpoint
     *     tags: [System]
     *     description: Check the health status of the mock server and its storage connections
     *     responses:
     *       200:
     *         description: Server is healthy
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/HealthCheck'
     */
    // Health check endpoint
    app.get(`${API_PREFIX}/health`, (req, res) => {
        const storageInfo = getStorageInfo();
        logger.info('✅ Health check passed');
        res.status(200).json({ 
            status: 'ok', 
            storage: storageInfo,
            mocks: mockStore.length,
            timestamp: new Date().toISOString()
        });
    });

    app.use(`${API_PREFIX}/mocks`, mockRoutes);
    app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
    
    // Only register metrics routes if OpenTelemetry is enabled
    if (metricsRoutes) {
        app.use(`${API_PREFIX}/metrics`, metricsRoutes);
    }

    /**
     * @swagger
     * /config:
     *   get:
     *     summary: Get server configuration
     *     tags: [System]
     *     description: Retrieve the current server configuration including API prefix and storage information
     *     responses:
     *       200:
     *         description: Configuration retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 apiPrefix:
     *                   type: string
     *                   description: API prefix used by the server
     *                   example: '/api'
     *                 storage:
     *                   type: object
     *                   properties:
     *                     type:
     *                       type: string
     *                       description: Storage backend type
     *                       example: 'postgresql'
     *                     initialized:
     *                       type: boolean
     *                       description: Whether storage is initialized
     *                       example: true
     */
    app.get(`${API_PREFIX}/config`, (req, res) => {
        const storageInfo = getStorageInfo();
        res.json({ 
            apiPrefix: API_PREFIX,
            storage: storageInfo
        });
    });

// Mock matching middleware - use middleware instead of app.all('*')
app.use(async (req, res, next) => {
    const skipPaths = [
        `${API_PREFIX}/health`,
        `${API_PREFIX}/config`,
        `${API_PREFIX}/mocks`,
        `${API_PREFIX}/analytics`,
        `${API_PREFIX}/metrics`,
        `${API_PREFIX}/docs`,
        `${API_PREFIX}/swagger`,
    ];

    if (skipPaths.some(p => req.path.startsWith(p))) return next();

    const result = findMock({
        method: req.method,
        path: req.path,
        headers: req.headers,
        query: req.query
    }, mockStore);

    if (result.found) {
        const mock = result.mock;
        const headerInfo = Object.keys(mock.headers || {}).length > 0 
            ? ` (matched headers: ${JSON.stringify(mock.headers)})`
            : '';
        const queryInfo = Object.keys(mock.queryParams || {}).length > 0
            ? ` (matched query params: ${JSON.stringify(mock.queryParams)})`
            : '';
        logger.info(`🎭 Matched mock "${mock.name}" for ${req.method} ${req.path}${headerInfo}${queryInfo}`);
        
        try {
            // Process dynamic response with delays and dynamic values
            const { response: processedResponse, metadata } = await dynamicResponse.processResponse(mock, req);
            
            // Set response headers if mock specifies them
            if (mock.responseHeaders) {
                Object.entries(mock.responseHeaders).forEach(([key, value]) => {
                    res.set(key, value);
                });
            }
            
            // Add metadata headers for debugging and analytics
            res.set('X-Mock-Id', mock.id);
            res.set('X-Mock-Name', mock.name);
            if (metadata.dynamicValues) {
                res.set('X-Mock-Dynamic', 'true');
            }
            if (metadata.processingTime > 0) {
                res.set('X-Mock-Processing-Time', `${metadata.processingTime}ms`);
            }
            res.set('X-Mock-Generated', metadata.generated);
            
            if (mock.delay) {
                logger.info(`⏱️ Applied ${metadata.processingTime}ms delay for mock "${mock.name}"`);
            }
            
            return res.status(mock.statusCode || 200).json(processedResponse);
        } catch (error) {
            logger.error(`❌ Error processing dynamic response: ${error.message}`);
            
            // Track the error in metrics (if OpenTelemetry is enabled)
            if (trackMockError) {
                trackMockError(mock.id, 'dynamic_response_error', error);
            }
            
            // Fallback to static response
            return res.status(mock.statusCode || 200).json(mock.response);
        }
    } else {
        // Filter out common development tool and browser requests to reduce log noise
        const commonDevPaths = [
            '/.well-known/',           // Chrome DevTools, browser discovery
            '/favicon.ico',            // Browser favicon requests
            '/apple-touch-icon',       // iOS icon requests
            '/_next/',                 // Next.js dev server
            '/__webpack',              // Webpack dev server
            '/sockjs-node/',           // Hot reload websockets
            '/hot-update',             // Hot module replacement
            '/.vscode/',               // VS Code extensions
            '/manifest.json',          // PWA manifest
            '/sw.js',                  // Service worker
            '/robots.txt'              // SEO robots file
        ];
        
        const isDevToolRequest = commonDevPaths.some(path => req.path.includes(path));
        
        // Log warning only for actual API calls that developers care about
        if (!isDevToolRequest) {
            logger.warn(`❌ No mock found for ${req.method} ${req.path}`);
        } else if (process.env.LOG_DEV_REQUESTS === 'true') {
            // Optional debug logging for development tool requests
            logger.debug(`🔍 Dev tool request: ${req.method} ${req.path}`);
        }
        
        return res.status(result.statusCode).json(result.response);
    }
});

// Catch-all fallback to index.html (for UI refresh / direct hits)
app.use((req, res, next) => {
    if (req.path.startsWith(API_PREFIX + '/')) {
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
    } else {
        next();
    }
});

// Start server
    const server = app.listen(PORT, () => {
        logger.info(`🚀 Server running at http://localhost:${PORT}${API_PREFIX}/`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
        logger.info(`📴 Received ${signal}. Starting graceful shutdown...`);
        
        server.close(async () => {
            logger.info('🔒 HTTP server closed');
            
            try {
                await closeStorage();
                logger.info('💾 Storage connections closed');
            } catch (err) {
                logger.error('❌ Error closing storage:', err.message);
            }
            
            try {
                if (otelSDK && shutdownTracing) {
                    await shutdownTracing(otelSDK);
                    logger.info('🔍 OpenTelemetry shutdown completed');
                }
            } catch (err) {
                logger.error('❌ Error shutting down OpenTelemetry:', err.message);
            }
            
            logger.info('✅ Graceful shutdown completed');
            process.exit(0);
        });
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Start the server
startServer().catch(err => {
    logger.error('❌ Failed to start server:', err.message);
    process.exit(1);
});
