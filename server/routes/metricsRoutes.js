const express = require('express');
const { MetricsCollector } = require('../metrics');
const logger = require('../logger');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     MetricsInfo:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: Status of metrics collection
 *           example: 'active'
 *         prometheus_endpoint:
 *           type: string
 *           description: Prometheus metrics endpoint
 *           example: '/api/metrics/prometheus'
 *         opentelemetry_enabled:
 *           type: boolean
 *           description: Whether OpenTelemetry is enabled
 *           example: true
 *         available_endpoints:
 *           type: array
 *           items:
 *             type: string
 *           description: List of available metrics endpoints
 */

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Get metrics information
 *     tags: [Metrics]
 *     description: Get information about available metrics endpoints and status
 *     responses:
 *       200:
 *         description: Metrics information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MetricsInfo'
 */
router.get('/', (req, res) => {
    try {
        const metricsInfo = {
            status: 'active',
            prometheus_endpoint: '/api/metrics/prometheus',
            opentelemetry_enabled: process.env.ENABLE_OTEL !== 'false',
            available_endpoints: [
                '/api/metrics/prometheus - Prometheus format metrics',
                '/api/metrics/health - Metrics system health check',
                '/api/metrics/summary - Human-readable metrics summary'
            ],
            description: 'Dynamic Mock Server Metrics Collection',
            timestamp: new Date().toISOString()
        };

        logger.info('📊 Metrics info requested');
        res.json(metricsInfo);
    } catch (error) {
        logger.error('❌ Failed to get metrics info:', error.message);
        res.status(500).json({ 
            error: 'Failed to retrieve metrics information',
            message: error.message 
        });
    }
});

/**
 * @swagger
 * /metrics/prometheus:
 *   get:
 *     summary: Get Prometheus metrics
 *     tags: [Metrics]
 *     description: Get all metrics in Prometheus format for scraping
 *     produces:
 *       - text/plain
 *     responses:
 *       200:
 *         description: Prometheus metrics in text format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: |
 *                 # HELP http_requests_total Total number of HTTP requests
 *                 # TYPE http_requests_total counter
 *                 http_requests_total{method="GET",route="/api/health",status_code="200"} 5
 */
router.get('/prometheus', async (req, res) => {
    try {
        const metrics = await MetricsCollector.getPrometheusMetrics();
        
        res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        res.send(metrics);
        
        logger.debug('📊 Prometheus metrics served');
    } catch (error) {
        logger.error('❌ Failed to get Prometheus metrics:', error.message);
        res.status(500).send('# Error retrieving metrics\n');
    }
});

/**
 * @swagger
 * /metrics/health:
 *   get:
 *     summary: Get metrics system health
 *     tags: [Metrics]
 *     description: Check the health status of the metrics collection system
 *     responses:
 *       200:
 *         description: Metrics system is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: 'healthy'
 *                 prometheus_active:
 *                   type: boolean
 *                   example: true
 *                 opentelemetry_active:
 *                   type: boolean
 *                   example: true
 *                 last_metric_time:
 *                   type: string
 *                   format: date-time
 *                 uptime_seconds:
 *                   type: number
 *                   example: 3600
 */
router.get('/health', (req, res) => {
    try {
        const healthInfo = {
            status: 'healthy',
            prometheus_active: true,
            opentelemetry_active: process.env.ENABLE_OTEL !== 'false',
            metrics_registry_size: MetricsCollector.getRegistry().getMetricsAsArray().length,
            uptime_seconds: process.uptime(),
            timestamp: new Date().toISOString(),
            node_version: process.version,
            memory_usage: process.memoryUsage(),
            cpu_usage: process.cpuUsage()
        };

        logger.debug('📊 Metrics health check performed');
        res.json(healthInfo);
    } catch (error) {
        logger.error('❌ Metrics health check failed:', error.message);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @swagger
 * /metrics/summary:
 *   get:
 *     summary: Get human-readable metrics summary
 *     tags: [Metrics]
 *     description: Get a summary of key metrics in human-readable format
 *     responses:
 *       200:
 *         description: Metrics summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                   description: Summary of collected metrics
 */
router.get('/summary', async (req, res) => {
    try {
        const registry = MetricsCollector.getRegistry();
        const metrics = registry.getMetricsAsArray();
        
        const summary = {
            total_metrics: metrics.length,
            metric_types: {},
            key_metrics: {},
            system_info: {
                uptime_seconds: process.uptime(),
                memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                node_version: process.version,
                platform: process.platform,
                pid: process.pid
            },
            timestamp: new Date().toISOString()
        };

        // Count metric types
        metrics.forEach(metric => {
            const type = metric.type;
            summary.metric_types[type] = (summary.metric_types[type] || 0) + 1;
        });

        // Get some key metric values
        try {
            const prometheusMetrics = await MetricsCollector.getPrometheusMetrics();
            
            // Parse some key metrics from the Prometheus output
            const lines = prometheusMetrics.split('\n');
            const httpRequestsMatch = lines.find(line => line.startsWith('http_requests_total'));
            const mockHitsMatch = lines.find(line => line.startsWith('mock_hits_total'));
            
            if (httpRequestsMatch) {
                const value = httpRequestsMatch.split(' ').pop();
                summary.key_metrics.total_http_requests = parseInt(value) || 0;
            }
            
            if (mockHitsMatch) {
                const value = mockHitsMatch.split(' ').pop();
                summary.key_metrics.total_mock_hits = parseInt(value) || 0;
            }
        } catch (parseError) {
            logger.warn('⚠️ Could not parse key metrics:', parseError.message);
        }

        logger.debug('📊 Metrics summary generated');
        res.json(summary);
    } catch (error) {
        logger.error('❌ Failed to generate metrics summary:', error.message);
        res.status(500).json({
            error: 'Failed to generate metrics summary',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
