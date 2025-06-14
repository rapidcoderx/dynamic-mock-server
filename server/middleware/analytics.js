const logger = require('../logger');
const { getStorageInstance } = require('../../utils/storageStrategy');

// In-memory analytics store (for fallback and caching)
const analyticsStore = {
    requests: [],
    mockHits: new Map(),
    responseTimesHistory: [],
    dailyStats: new Map()
};

/**
 * Get the storage instance (PostgreSQL or fallback)
 */
async function getStorage() {
    try {
        logger.debug('📊 Analytics - Getting storage instance for analytics...');
        const storage = getStorageInstance();
        logger.debug(`📊 Analytics - Storage instance obtained: ${storage ? 'success' : 'null'}`);
        
        if (storage && typeof storage.saveRequestHistory === 'function') {
            logger.debug('📊 Analytics - Storage has saveRequestHistory method, checking initialization...');
            
            // Check if storage is initialized
            if (!storage.initialized) {
                logger.info('📊 Analytics - Storage not initialized, attempting to initialize...');
                await storage.initialize();
                logger.info('📊 Analytics - Storage initialization completed');
            }
            
            logger.debug('📊 Analytics - Storage is ready for use');
            return storage;
        } else {
            logger.warn('📊 Analytics - Storage instance missing or lacks saveRequestHistory method');
        }
    } catch (error) {
        logger.error(`📊 Analytics - Error getting storage: ${error.message}`);
        logger.error(`📊 Analytics - Error stack: ${error.stack}`);
        logger.warn('Analytics storage not available, using in-memory fallback');
    }
    return null;
}

/**
 * Analytics middleware to track mock usage and performance
 */
function trackRequest(req, res, next) {
    // Skip tracking for analytics API calls and system endpoints to avoid noise in the data
    // Only track actual mock API calls and mock management operations
    const skipPaths = [
        '/api/analytics',     // Analytics API calls
        '/api/mocks',         // Mock management API calls
        '/api/config',        // Configuration API
        '/favicon.ico',       // Browser favicon requests
        '/public/',          // Static files
        '/styles.css',       // CSS files
        '/icon.svg',         // Icon files
        '/favicon.svg',      // SVG favicon
        '/.well-known/'      // Chrome DevTools and browser well-known paths
    ];
    
    // Check if this request should be skipped
    const shouldSkip = req.path === '/' || 
                      skipPaths.some(skipPath => req.path.startsWith(skipPath));
    
    if (shouldSkip) {
        return next();
    }
    
    const startTime = Date.now();
    
    // Track request start - ensure unique ID with timestamp, random string, and process hrtime
    const hrTime = process.hrtime.bigint();
    const randomPart = Math.random().toString(36).substr(2, 12);
    const requestId = `req_${Date.now()}_${hrTime}_${randomPart}`;
    const requestData = {
        id: requestId,
        timestamp: new Date(),
        method: req.method,
        path: req.path,
        headers: req.headers,
        query: req.query,
        body: req.body,
        bodySize: req.body ? JSON.stringify(req.body).length : 0,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        mockMatched: null,
        responseTime: null,
        statusCode: null,
        responseSize: null
    };

    // Store original res.json to capture response
    const originalJson = res.json;
    const originalSend = res.send;
    
    res.json = function(data) {
        captureResponse(data, 'json');
        return originalJson.call(this, data);
    };
    
    res.send = function(data) {
        captureResponse(data, 'send');
        return originalSend.call(this, data);
    };

    function captureResponse(data, type) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Update request data
        requestData.responseTime = responseTime;
        requestData.statusCode = res.statusCode;
        requestData.responseSize = JSON.stringify(data).length;
        
        // Check if this was a mock response
        const mockName = res.get('X-Mock-Name');
        const mockId = res.get('X-Mock-Id');
        
        if (mockId) {
            requestData.mockMatched = {
                id: mockId,
                name: mockName || 'Unknown'
            };
            
            // Track mock hit count in memory
            const currentHits = analyticsStore.mockHits.get(mockId) || 0;
            analyticsStore.mockHits.set(mockId, currentHits + 1);
        }
        
        // Store request in memory (for fallback)
        analyticsStore.requests.push(requestData);
        
        // Keep only last 1000 requests in memory to prevent memory issues
        if (analyticsStore.requests.length > 1000) {
            analyticsStore.requests = analyticsStore.requests.slice(-1000);
        }
        
        // Track response times for performance metrics
        analyticsStore.responseTimesHistory.push({
            timestamp: new Date(),
            responseTime,
            mockId: mockId || null,
            path: req.path,
            method: req.method
        });
        
        // Keep only last 500 response times in memory
        if (analyticsStore.responseTimesHistory.length > 500) {
            analyticsStore.responseTimesHistory = analyticsStore.responseTimesHistory.slice(-500);
        }
        
        // Update daily stats in memory
        updateDailyStats(requestData);
        
        // Save to database asynchronously (don't block response)
        logger.debug('📊 Analytics - Calling saveToDatabase...', {
            id: requestData.id,
            method: requestData.method,
            path: requestData.path
        });
        saveToDatabase(requestData).catch(error => {
            logger.error('📊 Analytics - Failed to save analytics to database:', {
                message: error.message,
                stack: error.stack
            });
        });
        
        logger.debug(`📊 Tracked request: ${req.method} ${req.path} - ${responseTime}ms - ${res.statusCode}`);
    }

    next();
}

/**
 * Update daily statistics
 */
function updateDailyStats(requestData) {
    const dateKey = requestData.timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!analyticsStore.dailyStats.has(dateKey)) {
        analyticsStore.dailyStats.set(dateKey, {
            date: dateKey,
            totalRequests: 0,
            mockHits: 0,
            notFoundRequests: 0,
            averageResponseTime: 0,
            responseTimesSum: 0,
            statusCodes: new Map(),
            topPaths: new Map(),
            topMocks: new Map()
        });
    }
    
    const dayStats = analyticsStore.dailyStats.get(dateKey);
    dayStats.totalRequests++;
    dayStats.responseTimesSum += requestData.responseTime;
    dayStats.averageResponseTime = dayStats.responseTimesSum / dayStats.totalRequests;
    
    // Track status codes
    const statusCount = dayStats.statusCodes.get(requestData.statusCode) || 0;
    dayStats.statusCodes.set(requestData.statusCode, statusCount + 1);
    
    // Track paths
    const pathCount = dayStats.topPaths.get(requestData.path) || 0;
    dayStats.topPaths.set(requestData.path, pathCount + 1);
    
    // Track mocks
    if (requestData.mockMatched) {
        dayStats.mockHits++;
        const mockCount = dayStats.topMocks.get(requestData.mockMatched.id) || 0;
        dayStats.topMocks.set(requestData.mockMatched.id, mockCount + 1);
    } else if (requestData.statusCode === 404) {
        dayStats.notFoundRequests++;
    }
}

/**
 * Get analytics summary
 */
async function getAnalyticsSummary() {
    const storage = await getStorage();
    
    // Try to get data from database first
    if (storage && typeof storage.getAnalyticsSummary === 'function') {
        try {
            return await storage.getAnalyticsSummary();
        } catch (error) {
            logger.warn('Failed to get analytics from database, falling back to memory:', error.message);
        }
    }
    
    // Fallback to in-memory analytics
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Filter requests for different time periods
    const recentRequests = analyticsStore.requests.filter(req => req.timestamp >= last24Hours);
    const weeklyRequests = analyticsStore.requests.filter(req => req.timestamp >= last7Days);
    
    // Calculate response time stats
    const recentResponseTimes = recentRequests.map(req => req.responseTime).filter(time => time !== null);
    const avgResponseTime = recentResponseTimes.length > 0 
        ? recentResponseTimes.reduce((sum, time) => sum + time, 0) / recentResponseTimes.length 
        : 0;
    
    const maxResponseTime = recentResponseTimes.length > 0 ? Math.max(...recentResponseTimes) : 0;
    const minResponseTime = recentResponseTimes.length > 0 ? Math.min(...recentResponseTimes) : 0;
    
    // Get top mocks
    const mockHitsArray = Array.from(analyticsStore.mockHits.entries())
        .map(([mockId, count]) => ({ mockId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    
    // Get request distribution by status code
    const statusDistribution = {};
    recentRequests.forEach(req => {
        statusDistribution[req.statusCode] = (statusDistribution[req.statusCode] || 0) + 1;
    });
    
    return {
        summary: {
            totalRequests: analyticsStore.requests.length,
            totalMockHits: Array.from(analyticsStore.mockHits.values()).reduce((sum, count) => sum + count, 0),
            uniqueMocksHit: analyticsStore.mockHits.size,
            recentRequests24h: recentRequests.length,
            weeklyRequests: weeklyRequests.length
        },
        performance: {
            averageResponseTime: Math.round(avgResponseTime),
            maxResponseTime,
            minResponseTime,
            responseTimeDistribution: getResponseTimeDistribution(recentResponseTimes)
        },
        topMocks: mockHitsArray,
        statusDistribution,
        dailyStats: Array.from(analyticsStore.dailyStats.values())
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 30) // Last 30 days
    };
}

/**
 * Get response time distribution
 */
function getResponseTimeDistribution(responseTimes) {
    const buckets = {
        '0-10ms': 0,
        '11-50ms': 0,
        '51-100ms': 0,
        '101-500ms': 0,
        '501ms+': 0
    };
    
    responseTimes.forEach(time => {
        if (time <= 10) buckets['0-10ms']++;
        else if (time <= 50) buckets['11-50ms']++;
        else if (time <= 100) buckets['51-100ms']++;
        else if (time <= 500) buckets['101-500ms']++;
        else buckets['501ms+']++;
    });
    
    return buckets;
}

/**
 * Get filtered request history
 */
async function getRequestHistory(filters = {}) {
    const storage = await getStorage();
    
    // Try to get data from database first
    if (storage && typeof storage.getRequestHistory === 'function') {
        try {
            return await storage.getRequestHistory(filters);
        } catch (error) {
            logger.warn('Failed to get request history from database, falling back to memory:', error.message);
        }
    }
    
    // Fallback to in-memory analytics
    let filteredRequests = [...analyticsStore.requests];
    
    // Apply filters
    if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        filteredRequests = filteredRequests.filter(req => req.timestamp >= startDate);
    }
    
    if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        filteredRequests = filteredRequests.filter(req => req.timestamp <= endDate);
    }
    
    if (filters.method) {
        filteredRequests = filteredRequests.filter(req => req.method === filters.method.toUpperCase());
    }
    
    if (filters.path) {
        filteredRequests = filteredRequests.filter(req => req.path.includes(filters.path));
    }
    
    if (filters.statusCode) {
        filteredRequests = filteredRequests.filter(req => req.statusCode === parseInt(filters.statusCode));
    }
    
    if (filters.mockId) {
        filteredRequests = filteredRequests.filter(req => 
            req.mockMatched && req.mockMatched.id === filters.mockId
        );
    }
    
    if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredRequests = filteredRequests.filter(req => 
            req.path.toLowerCase().includes(searchTerm) ||
            req.method.toLowerCase().includes(searchTerm) ||
            (req.mockMatched && req.mockMatched.name.toLowerCase().includes(searchTerm))
        );
    }
    
    // Sort by timestamp (newest first)
    filteredRequests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
        requests: filteredRequests.slice(startIndex, endIndex),
        pagination: {
            total: filteredRequests.length,
            page,
            limit,
            totalPages: Math.ceil(filteredRequests.length / limit)
        }
    };
}

/**
 * Clear analytics data
 */
async function clearAnalytics() {
    const storage = await getStorage();
    
    // Clear database first
    if (storage && typeof storage.clearAnalytics === 'function') {
        try {
            await storage.clearAnalytics();
        } catch (error) {
            logger.warn('Failed to clear analytics from database:', error.message);
        }
    }
    
    // Clear in-memory data
    analyticsStore.requests = [];
    analyticsStore.mockHits.clear();
    analyticsStore.responseTimesHistory = [];
    analyticsStore.dailyStats.clear();
    logger.info('📊 Analytics data cleared');
}

/**
 * Save analytics data to database
 */
async function saveToDatabase(requestData) {
    logger.debug('📊 Analytics - Attempting to save to database...', {
        id: requestData.id,
        method: requestData.method,
        path: requestData.path
    });
    
    const storage = await getStorage();
    if (!storage) {
        logger.debug('📊 Analytics - No storage available, skipping database save');
        return;
    }

    try {
        logger.debug('📊 Analytics - Storage available, saving request history...');
        // Save request history
        await storage.saveRequestHistory(requestData);
        logger.debug('📊 Analytics - Request history saved successfully');
        
        // Update mock hits if applicable
        if (requestData.mockMatched) {
            logger.debug('📊 Analytics - Updating mock hits...');
            await storage.updateMockHits(requestData.mockMatched.id, requestData.mockMatched.name);
            logger.debug('📊 Analytics - Mock hits updated successfully');
        }
        
        // Update daily stats
        logger.debug('📊 Analytics - Updating daily stats...');
        await storage.updateDailyStats(requestData);
        logger.debug('📊 Analytics - Daily stats updated successfully');
        
    } catch (error) {
        logger.error('📊 Analytics - Error saving analytics to database:', {
            message: error.message,
            code: error.code,
            stack: error.stack
        });
    }
}

module.exports = {
    trackRequest,
    getAnalyticsSummary,
    getRequestHistory,
    clearAnalytics,
    analyticsStore
};
