require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { applySecurity } = require('./security');
const logger = require('./logger');
const { router: mockRoutes, mockStore } = require('./routes/mockRoutes');
const { findMock } = require('../utils/matcher');
const { loadMocks } = require('../utils/storageStrategy');
const dynamicResponse = require('../utils/dynamicResponse');

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

logger.info(`Starting server with API prefix: ${API_PREFIX}`);
app.use(express.json());
app.use(cors());
applySecurity(app);

mockStore.push(...loadMocks());

// Serve static files under the prefix
app.use(`${API_PREFIX}/`, express.static(path.join(__dirname, '..', 'public')));

// Health check endpoint
app.get(`${API_PREFIX}/health`, (req, res) => {
    logger.info('✅ Health check passed');
    res.status(200).json({ status: 'ok' });
});

app.use(`${API_PREFIX}/mocks`, mockRoutes);

app.get(`${API_PREFIX}/config`, (req, res) => {
    res.json({ apiPrefix: API_PREFIX });
});

// Mock matching middleware - use middleware instead of app.all('*')
app.use(async (req, res, next) => {
    const skipPaths = [
        `${API_PREFIX}/health`,
        `${API_PREFIX}/config`,
        `${API_PREFIX}/mocks`,
    ];

    if (skipPaths.some(p => req.path.startsWith(p))) return next();

    const result = findMock({
        method: req.method,
        path: req.path,
        headers: req.headers
    }, mockStore);

    if (result.found) {
        const mock = result.mock;
        const headerInfo = Object.keys(mock.headers || {}).length > 0 
            ? ` (matched headers: ${JSON.stringify(mock.headers)})`
            : '';
        logger.info(`🎭 Matched mock "${mock.name}" for ${req.method} ${req.path}${headerInfo}`);
        
        try {
            // Process dynamic response with delays and dynamic values
            const { response: processedResponse, metadata } = await dynamicResponse.processResponse(mock, req);
            
            // Set response headers if mock specifies them
            if (mock.responseHeaders) {
                Object.entries(mock.responseHeaders).forEach(([key, value]) => {
                    res.set(key, value);
                });
            }
            
            // Add metadata headers for debugging
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
app.listen(PORT, () => {
    logger.info(`🚀 Server running at http://localhost:${PORT}${API_PREFIX}/`);
});
