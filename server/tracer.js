require('dotenv').config();
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { resourceFromAttributes } = require('@opentelemetry/resources');
const { 
    SEMRESATTRS_SERVICE_NAME, 
    SEMRESATTRS_SERVICE_VERSION 
} = require('@opentelemetry/semantic-conventions');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

// Service configuration from environment variables
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'dynamic-mock-server';
const SERVICE_VERSION = process.env.OTEL_SERVICE_VERSION || '1.0.0';
const OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces';
const PROMETHEUS_PORT = parseInt(process.env.PROMETHEUS_PORT || '9464', 10);
const PROMETHEUS_ENDPOINT = process.env.PROMETHEUS_ENDPOINT || '/metrics';

/**
 * Configure OpenTelemetry SDK with tracing and metrics
 */
function initializeTracing() {
    // Create OTLP exporter for traces (optional)
    let traceExporter = null;
    if (process.env.ENABLE_TRACING === 'true') {
        try {
            const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
            traceExporter = new OTLPTraceExporter({
                url: OTLP_ENDPOINT,
            });
        } catch (error) {
            console.warn('⚠️ OTLP trace exporter not available:', error.message);
            console.warn('💡 Install @opentelemetry/exporter-trace-otlp-http for trace export');
        }
    }

    // Create Prometheus exporter for metrics
    const prometheusExporter = new PrometheusExporter({
        port: PROMETHEUS_PORT,
        endpoint: PROMETHEUS_ENDPOINT,
    });

    // Configure the SDK
    const sdk = new NodeSDK({
        resource: resourceFromAttributes({
            [SEMRESATTRS_SERVICE_NAME]: SERVICE_NAME,
            [SEMRESATTRS_SERVICE_VERSION]: SERVICE_VERSION,
            environment: process.env.NODE_ENV || 'development',
            'service.instance.id': `${SERVICE_NAME}-${process.pid}`,
        }),
        
        // Auto-instrumentation for common libraries
        instrumentations: [
            getNodeAutoInstrumentations({
                // Disable some instrumentations if not needed
                '@opentelemetry/instrumentation-fs': {
                    enabled: false, // Reduce noise from file system operations
                },
                '@opentelemetry/instrumentation-dns': {
                    enabled: false, // Reduce noise from DNS operations
                },
                // Express and HTTP instrumentations are important for our use case
                '@opentelemetry/instrumentation-express': {
                    enabled: true,
                    requestHook: (span, info) => {
                        // Add custom attributes to Express spans
                        span.setAttributes({
                            'mock.server.version': SERVICE_VERSION,
                            'mock.request.path': info.request.url,
                            'mock.request.method': info.request.method,
                        });
                    },
                },
                '@opentelemetry/instrumentation-http': {
                    enabled: true,
                    requestHook: (span, request) => {
                        // Add custom attributes to HTTP spans
                        span.setAttributes({
                            'http.target': request.url,
                            'http.user_agent': request.headers['user-agent'] || 'unknown',
                        });
                    },
                },
                '@opentelemetry/instrumentation-mongodb': {
                    enabled: true, // For mongoose connections
                },
                '@opentelemetry/instrumentation-pg': {
                    enabled: true, // For PostgreSQL connections
                },
            }),
        ],

        // Metrics configuration
        metricReader: new PeriodicExportingMetricReader({
            exporter: prometheusExporter,
            exportIntervalMillis: 5000, // Export metrics every 5 seconds
        }),

        // Trace exporter (optional - only if OTLP is available and enabled)
        traceExporter: traceExporter,
    });

    // Initialize the SDK
    try {
        sdk.start();
        console.log(`🔍 OpenTelemetry initialized successfully`);
        console.log(`📊 Prometheus metrics available at http://localhost:${PROMETHEUS_PORT}${PROMETHEUS_ENDPOINT}`);
        
        if (traceExporter) {
            console.log(`🔗 OTLP tracing enabled - endpoint: ${OTLP_ENDPOINT}`);
        } else if (process.env.ENABLE_TRACING === 'true') {
            console.log(`⚠️ Tracing requested but OTLP exporter not available`);
        }
        
        return sdk;
    } catch (error) {
        console.error('❌ Failed to initialize OpenTelemetry:', error);
        throw error;
    }
}

/**
 * Graceful shutdown of OpenTelemetry
 */
function shutdownTracing(sdk) {
    return sdk.shutdown()
        .then(() => console.log('🔍 OpenTelemetry shut down successfully'))
        .catch((error) => console.error('❌ Error shutting down OpenTelemetry:', error));
}

module.exports = {
    initializeTracing,
    shutdownTracing,
    SERVICE_NAME,
    SERVICE_VERSION,
    PROMETHEUS_PORT,
    PROMETHEUS_ENDPOINT
};
