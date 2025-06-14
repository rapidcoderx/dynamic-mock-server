const { MetricsCollector } = require('../metrics');
const logger = require('../logger');

/**
 * Middleware to collect metrics for all HTTP requests
 * This works alongside the existing analytics middleware
 */
function metricsMiddleware(req, res, next) {
    const startTime = Date.now();
    const startHrTime = process.hrtime.bigint();

    // Create OpenTelemetry span for this request
    const span = MetricsCollector.createSpan(`HTTP ${req.method} ${req.path}`, {
        'http.method': req.method,
        'http.url': req.url,
        'http.route': req.route?.path || req.path,
        'http.user_agent': req.get('User-Agent') || 'unknown',
        'http.remote_addr': req.ip || req.connection.remoteAddress,
    });

    // Store span in request for later use
    req.otelSpan = span;

    // Override res.end to capture metrics when response is sent
    const originalEnd = res.end;
    
    res.end = function(chunk, encoding) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Get mock information from response headers if available
        const mockId = res.get('X-Mock-Id');
        const mockName = res.get('X-Mock-Name');
        const mockInfo = mockId ? { id: mockId, name: mockName } : null;

        try {
            // Record HTTP request metrics
            MetricsCollector.recordHttpRequest(req, res, responseTime, mockInfo);

            // Record mock-specific metrics if this was a mock response
            if (mockInfo) {
                MetricsCollector.recordMockHit(
                    mockInfo.id,
                    mockInfo.name || 'Unknown',
                    req.method,
                    req.path,
                    responseTime
                );
            }

            // Update OpenTelemetry span
            span.setAttributes({
                'http.status_code': res.statusCode,
                'http.response_time_ms': responseTime,
                'mock.matched': !!mockInfo,
                'mock.id': mockId || 'none',
                'mock.name': mockName || 'none',
            });

            // Set span status based on HTTP status code
            if (res.statusCode >= 400) {
                span.recordException(new Error(`HTTP ${res.statusCode}`));
                span.setStatus({
                    code: 2, // ERROR
                    message: `HTTP ${res.statusCode}`
                });
            } else {
                span.setStatus({ code: 1 }); // OK
            }

            logger.debug(`📊 Metrics collected for ${req.method} ${req.path} - ${responseTime}ms - ${res.statusCode}`);
        } catch (error) {
            logger.error('❌ Error collecting metrics:', error.message);
            span.recordException(error);
            span.setStatus({
                code: 2, // ERROR
                message: error.message
            });
        } finally {
            // End the OpenTelemetry span
            span.end();
        }

        // Call the original res.end
        return originalEnd.call(this, chunk, encoding);
    };

    next();
}

/**
 * Middleware to track mock configuration changes
 */
function trackMockConfigChange(mockStore) {
    const count = Array.isArray(mockStore) ? mockStore.length : 0;
    MetricsCollector.updateMockConfigCount(count);
    logger.debug(`📊 Mock configuration count updated: ${count}`);
}

/**
 * Function to record storage operation metrics
 */
function trackStorageOperation(operation, storageType) {
    const startTime = Date.now();
    
    return {
        end: (success = true, error = null) => {
            const duration = Date.now() - startTime;
            MetricsCollector.recordStorageOperation(operation, storageType, duration, success);
            
            if (error) {
                logger.error(`❌ Storage operation failed: ${operation} on ${storageType}`, error.message);
            } else {
                logger.debug(`📊 Storage operation completed: ${operation} on ${storageType} (${duration}ms)`);
            }
        }
    };
}

/**
 * Function to record analytics events
 */
function trackAnalyticsEvent(eventType, success = true) {
    MetricsCollector.recordAnalyticsEvent(eventType, success);
    logger.debug(`📊 Analytics event tracked: ${eventType} (${success})`);
}

/**
 * Function to record mock processing errors
 */
function trackMockError(mockId, errorType, error) {
    MetricsCollector.recordMockError(mockId, errorType);
    logger.error(`❌ Mock error tracked: ${mockId} - ${errorType}`, error?.message || 'Unknown error');
}

/**
 * Middleware to update storage connection metrics
 */
function updateStorageConnectionMetrics(storageType, connectionCount) {
    MetricsCollector.updateStorageConnections(storageType, connectionCount);
    logger.debug(`📊 Storage connections updated: ${storageType} = ${connectionCount}`);
}

module.exports = {
    metricsMiddleware,
    trackMockConfigChange,
    trackStorageOperation,
    trackAnalyticsEvent,
    trackMockError,
    updateStorageConnectionMetrics
};
