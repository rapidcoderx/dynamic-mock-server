const { metrics, trace } = require('@opentelemetry/api');
const promClient = require('prom-client');
const logger = require('./logger');

/**
 * Custom metrics for the Dynamic Mock Server
 * This module provides both OpenTelemetry metrics and direct Prometheus metrics
 */

// Initialize the default metrics for Node.js process
promClient.collectDefaultMetrics({
    prefix: 'dynamic_mock_server_',
    timeout: 5000,
});

// Create a registry for our custom metrics
const register = new promClient.Registry();

// Add default metrics to our registry
register.setDefaultLabels({
    app: 'dynamic-mock-server',
    version: process.env.npm_package_version || '1.0.0'
});

promClient.register.setDefaultLabels({
    app: 'dynamic-mock-server',
    version: process.env.npm_package_version || '1.0.0'
});

// OpenTelemetry meter
const meter = metrics.getMeter('dynamic-mock-server', '1.0.0');

// === PROMETHEUS METRICS ===

// HTTP request metrics
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code', 'mock_matched'],
    buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1, 2, 5]
});

const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code', 'mock_matched']
});

const httpRequestSize = new promClient.Histogram({
    name: 'http_request_size_bytes',
    help: 'Size of HTTP requests in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 1000, 10000, 100000, 1000000]
});

const httpResponseSize = new promClient.Histogram({
    name: 'http_response_size_bytes',
    help: 'Size of HTTP responses in bytes',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [100, 1000, 10000, 100000, 1000000]
});

// Mock-specific metrics
const mockHitsTotal = new promClient.Counter({
    name: 'mock_hits_total',
    help: 'Total number of mock hits',
    labelNames: ['mock_id', 'mock_name', 'method', 'route']
});

const mockResponseTime = new promClient.Histogram({
    name: 'mock_response_time_seconds',
    help: 'Response time for mock requests',
    labelNames: ['mock_id', 'mock_name', 'method'],
    buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 1, 2, 5]
});

const mockConfigTotal = new promClient.Gauge({
    name: 'mock_configs_total',
    help: 'Total number of configured mocks'
});

const mockProcessingErrors = new promClient.Counter({
    name: 'mock_processing_errors_total',
    help: 'Total number of mock processing errors',
    labelNames: ['mock_id', 'error_type']
});

// Storage metrics
const storageOperationDuration = new promClient.Histogram({
    name: 'storage_operation_duration_seconds',
    help: 'Duration of storage operations',
    labelNames: ['operation', 'storage_type', 'success'],
    buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.2, 0.5, 1, 2, 5]
});

const storageConnectionsActive = new promClient.Gauge({
    name: 'storage_connections_active',
    help: 'Number of active storage connections',
    labelNames: ['storage_type']
});

// Analytics metrics
const analyticsEventsTotal = new promClient.Counter({
    name: 'analytics_events_total',
    help: 'Total number of analytics events processed',
    labelNames: ['event_type', 'success']
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestSize);
register.registerMetric(httpResponseSize);
register.registerMetric(mockHitsTotal);
register.registerMetric(mockResponseTime);
register.registerMetric(mockConfigTotal);
register.registerMetric(mockProcessingErrors);
register.registerMetric(storageOperationDuration);
register.registerMetric(storageConnectionsActive);
register.registerMetric(analyticsEventsTotal);

// === OPENTELEMETRY METRICS ===

// OpenTelemetry counters and histograms
const otelHttpRequestsCounter = meter.createCounter('http_requests_total_otel', {
    description: 'Total number of HTTP requests (OpenTelemetry)',
});

const otelHttpDurationHistogram = meter.createHistogram('http_request_duration_otel', {
    description: 'Duration of HTTP requests (OpenTelemetry)',
    unit: 'ms',
});

const otelMockHitsCounter = meter.createCounter('mock_hits_total_otel', {
    description: 'Total number of mock hits (OpenTelemetry)',
});

const otelMockConfigGauge = meter.createUpDownCounter('mock_configs_active_otel', {
    description: 'Number of active mock configurations (OpenTelemetry)',
});

/**
 * Metrics collection functions
 */
class MetricsCollector {
    /**
     * Record HTTP request metrics
     */
    static recordHttpRequest(req, res, responseTime, mockInfo = null) {
        const method = req.method;
        const route = req.route?.path || req.path;
        const statusCode = res.statusCode.toString();
        const mockMatched = mockInfo ? 'true' : 'false';
        
        // Prometheus metrics
        httpRequestsTotal.inc({ 
            method, 
            route, 
            status_code: statusCode, 
            mock_matched: mockMatched 
        });
        
        httpRequestDuration.observe(
            { method, route, status_code: statusCode, mock_matched: mockMatched },
            responseTime / 1000 // Convert to seconds
        );

        // Request/Response size
        const requestSize = req.get('content-length') || 0;
        const responseSize = res.get('content-length') || 0;
        
        if (requestSize > 0) {
            httpRequestSize.observe({ method, route }, parseInt(requestSize));
        }
        
        if (responseSize > 0) {
            httpResponseSize.observe({ method, route, status_code: statusCode }, parseInt(responseSize));
        }

        // OpenTelemetry metrics
        otelHttpRequestsCounter.add(1, {
            method,
            route,
            status_code: statusCode,
            mock_matched: mockMatched
        });

        otelHttpDurationHistogram.record(responseTime, {
            method,
            route,
            status_code: statusCode
        });

        logger.debug(`📊 Metrics - Recorded HTTP request: ${method} ${route} ${statusCode} (${responseTime}ms)`);
    }

    /**
     * Record mock hit metrics
     */
    static recordMockHit(mockId, mockName, method, route, responseTime) {
        // Prometheus metrics
        mockHitsTotal.inc({ 
            mock_id: mockId, 
            mock_name: mockName, 
            method, 
            route 
        });
        
        mockResponseTime.observe(
            { mock_id: mockId, mock_name: mockName, method },
            responseTime / 1000 // Convert to seconds
        );

        // OpenTelemetry metrics
        otelMockHitsCounter.add(1, {
            mock_id: mockId,
            mock_name: mockName,
            method,
            route
        });

        logger.debug(`📊 Metrics - Recorded mock hit: ${mockName} (${mockId})`);
    }

    /**
     * Update mock configuration count
     */
    static updateMockConfigCount(count) {
        mockConfigTotal.set(count);
        
        // For OpenTelemetry, we need to track the change
        const currentCount = this._currentMockCount || 0;
        const delta = count - currentCount;
        otelMockConfigGauge.add(delta);
        this._currentMockCount = count;

        logger.debug(`📊 Metrics - Updated mock config count: ${count}`);
    }

    /**
     * Record mock processing error
     */
    static recordMockError(mockId, errorType) {
        mockProcessingErrors.inc({ mock_id: mockId, error_type: errorType });
        logger.debug(`📊 Metrics - Recorded mock error: ${mockId} (${errorType})`);
    }

    /**
     * Record storage operation metrics
     */
    static recordStorageOperation(operation, storageType, duration, success = true) {
        storageOperationDuration.observe(
            { 
                operation, 
                storage_type: storageType, 
                success: success.toString() 
            },
            duration / 1000 // Convert to seconds
        );

        logger.debug(`📊 Metrics - Recorded storage operation: ${operation} on ${storageType} (${duration}ms)`);
    }

    /**
     * Update storage connection count
     */
    static updateStorageConnections(storageType, count) {
        storageConnectionsActive.set({ storage_type: storageType }, count);
        logger.debug(`📊 Metrics - Updated storage connections: ${storageType} = ${count}`);
    }

    /**
     * Record analytics event
     */
    static recordAnalyticsEvent(eventType, success = true) {
        analyticsEventsTotal.inc({ 
            event_type: eventType, 
            success: success.toString() 
        });
        logger.debug(`📊 Metrics - Recorded analytics event: ${eventType} (${success})`);
    }

    /**
     * Get all metrics in Prometheus format
     */
    static async getPrometheusMetrics() {
        return await promClient.register.metrics();
    }

    /**
     * Get custom metrics registry
     */
    static getRegistry() {
        return register;
    }

    /**
     * Create a custom span for tracing
     */
    static createSpan(name, attributes = {}) {
        const tracer = trace.getTracer('dynamic-mock-server');
        return tracer.startSpan(name, { attributes });
    }
}

// Static property to track current mock count
MetricsCollector._currentMockCount = 0;

module.exports = {
    MetricsCollector,
    promClient,
    register
};
