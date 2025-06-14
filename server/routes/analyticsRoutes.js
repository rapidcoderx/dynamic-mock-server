const express = require('express');
const logger = require('../logger');
const { 
    getAnalyticsSummary, 
    getRequestHistory, 
    clearAnalytics 
} = require('../middleware/analytics');

const router = express.Router();

/**
 * @swagger
 * /analytics/summary:
 *   get:
 *     summary: Get analytics overview
 *     tags: [Analytics]
 *     description: Retrieve comprehensive analytics summary including request counts, performance metrics, and mock usage statistics
 *     responses:
 *       200:
 *         description: Analytics summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalyticsSummary'
 *       500:
 *         description: Failed to retrieve analytics summary
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET /analytics/summary - Get analytics overview
 */
router.get('/summary', async (req, res) => {
    try {
        const summary = await getAnalyticsSummary();
        logger.info('📊 Analytics summary requested');
        res.json(summary);
    } catch (error) {
        logger.error(`❌ Error getting analytics summary: ${error.message}`);
        res.status(500).json({ error: 'Failed to get analytics summary' });
    }
});

/**
 * @swagger
 * /analytics/requests:
 *   get:
 *     summary: Get request history with filtering
 *     tags: [Analytics]
 *     description: Retrieve request history with optional filtering by date range, method, path, status code, and more
 *     parameters:
 *       - name: startDate
 *         in: query
 *         description: Start date for filtering (ISO 8601 format)
 *         schema:
 *           type: string
 *           format: date-time
 *           example: '2024-01-01T00:00:00Z'
 *       - name: endDate
 *         in: query
 *         description: End date for filtering (ISO 8601 format)
 *         schema:
 *           type: string
 *           format: date-time
 *           example: '2024-12-31T23:59:59Z'
 *       - name: method
 *         in: query
 *         description: Filter by HTTP method
 *         schema:
 *           type: string
 *           enum: [GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS]
 *           example: 'GET'
 *       - name: path
 *         in: query
 *         description: Filter by request path (supports partial matches)
 *         schema:
 *           type: string
 *           example: '/users'
 *       - name: statusCode
 *         in: query
 *         description: Filter by HTTP status code
 *         schema:
 *           type: integer
 *           example: 200
 *       - name: mockId
 *         in: query
 *         description: Filter by specific mock ID
 *         schema:
 *           type: string
 *           example: 'mock_123'
 *       - name: search
 *         in: query
 *         description: General search term (searches across multiple fields)
 *         schema:
 *           type: string
 *           example: 'user'
 *       - name: page
 *         in: query
 *         description: Page number for pagination (1-based)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *       - name: limit
 *         in: query
 *         description: Number of results per page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *           example: 50
 *     responses:
 *       200:
 *         description: Request history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 requests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RequestHistory'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       description: Total number of requests matching filters
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                     limit:
 *                       type: integer
 *                       description: Number of results per page
 *                     totalPages:
 *                       type: integer
 *                       description: Total number of pages
 *       500:
 *         description: Failed to retrieve request history
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET /analytics/requests - Get request history with filtering
 */
router.get('/requests', async (req, res) => {
    try {
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            method: req.query.method,
            path: req.query.path,
            statusCode: req.query.statusCode,
            mockId: req.query.mockId,
            search: req.query.search,
            page: req.query.page,
            limit: req.query.limit
        };
        
        // Remove undefined values
        Object.keys(filters).forEach(key => 
            filters[key] === undefined && delete filters[key]
        );
        
        const result = await getRequestHistory(filters);
        logger.info(`📊 Request history requested with filters: ${JSON.stringify(filters)}`);
        res.json(result);
    } catch (error) {
        logger.error(`❌ Error getting request history: ${error.message}`);
        res.status(500).json({ error: 'Failed to get request history' });
    }
});

/**
 * @swagger
 * /analytics/performance:
 *   get:
 *     summary: Get performance metrics
 *     tags: [Analytics]
 *     description: Retrieve detailed performance metrics including response times, daily performance trends, and real-time metrics
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 responseTimeMetrics:
 *                   type: object
 *                   properties:
 *                     averageResponseTime:
 *                       type: number
 *                       example: 125.5
 *                     maxResponseTime:
 *                       type: integer
 *                       example: 500
 *                     minResponseTime:
 *                       type: integer
 *                       example: 50
 *                     responseTimeDistribution:
 *                       type: object
 *                       example: { "0-10ms": 150, "11-50ms": 300 }
 *                 dailyPerformance:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                         format: date
 *                       averageResponseTime:
 *                         type: integer
 *                       totalRequests:
 *                         type: integer
 *                       mockHitRate:
 *                         type: string
 *                 realtimeMetrics:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Failed to retrieve performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET /analytics/performance - Get performance metrics
 */
router.get('/performance', async (req, res) => {
    try {
        const summary = await getAnalyticsSummary();
        const performanceData = {
            responseTimeMetrics: summary.performance,
            dailyPerformance: (summary.dailyStats || []).map(day => ({
                date: day.date,
                averageResponseTime: Math.round(day.averageResponseTime || 0),
                totalRequests: day.totalRequests || 0,
                mockHitRate: day.totalRequests > 0 ? ((day.mockHits || 0) / day.totalRequests * 100).toFixed(1) : 0
            })).slice(0, 7), // Last 7 days
            realtimeMetrics: {
                timestamp: new Date().toISOString(),
                ...summary.performance
            }
        };
        
        logger.info('📊 Performance metrics requested');
        res.json(performanceData);
    } catch (error) {
        logger.error(`❌ Error getting performance metrics: ${error.message}`);
        res.status(500).json({ error: 'Failed to get performance metrics' });
    }
});

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get complete dashboard data
 *     tags: [Analytics]
 *     description: Retrieve comprehensive dashboard data including overview, performance, trends, and recent requests
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                   description: Summary statistics
 *                 performance:
 *                   type: object
 *                   description: Performance metrics
 *                 topMocks:
 *                   type: array
 *                   description: Most frequently used mocks
 *                 statusDistribution:
 *                   type: object
 *                   description: HTTP status code distribution
 *                 recentRequests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RequestHistory'
 *                 dailyTrends:
 *                   type: array
 *                   description: Daily trend data for the last 7 days
 *                 lastUpdated:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Failed to retrieve dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET /analytics/dashboard - Get complete dashboard data
 */
router.get('/dashboard', async (req, res) => {
    try {
        const summary = await getAnalyticsSummary();
        const recentRequests = await getRequestHistory({ limit: 10 });
        
        const dashboardData = {
            overview: summary.summary,
            performance: summary.performance,
            topMocks: summary.topMocks,
            statusDistribution: summary.statusDistribution,
            recentRequests: recentRequests.requests,
            dailyTrends: (summary.dailyStats || []).slice(0, 7).map(day => ({
                date: day.date,
                requests: day.totalRequests,
                mockHits: day.mockHits,
                averageResponseTime: Math.round(day.averageResponseTime || 0),
                successRate: day.totalRequests > 0 
                    ? ((day.totalRequests - (day.notFoundRequests || 0)) / day.totalRequests * 100).toFixed(1)
                    : 100
            })),
            lastUpdated: new Date().toISOString()
        };
        
        logger.info('📊 Dashboard data requested');
        res.json(dashboardData);
    } catch (error) {
        logger.error(`❌ Error getting dashboard data: ${error.message}`);
        res.status(500).json({ error: 'Failed to get dashboard data' });
    }
});

/**
 * @swagger
 * /analytics:
 *   delete:
 *     summary: Clear analytics data
 *     tags: [Analytics]
 *     description: Clear all analytics data including request history, mock hits, and daily statistics
 *     responses:
 *       200:
 *         description: Analytics data cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Analytics data cleared successfully'
 *       500:
 *         description: Failed to clear analytics data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * DELETE /analytics - Clear analytics data
 */
router.delete('/', async (req, res) => {
    try {
        await clearAnalytics();
        logger.info('📊 Analytics data cleared by user request');
        res.json({ message: 'Analytics data cleared successfully' });
    } catch (error) {
        logger.error(`❌ Error clearing analytics: ${error.message}`);
        res.status(500).json({ error: 'Failed to clear analytics data' });
    }
});

/**
 * @swagger
 * /analytics/export:
 *   get:
 *     summary: Export analytics data
 *     tags: [Analytics]
 *     description: Export all analytics data in JSON or CSV format for external analysis
 *     parameters:
 *       - name: format
 *         in: query
 *         description: Export format (json or csv)
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *           example: 'json'
 *     responses:
 *       200:
 *         description: Analytics data exported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exportDate:
 *                   type: string
 *                   format: date-time
 *                 summary:
 *                   type: object
 *                   description: Analytics summary
 *                 performance:
 *                   type: object
 *                   description: Performance metrics
 *                 dailyStats:
 *                   type: array
 *                   description: Daily statistics
 *                 requests:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RequestHistory'
 *           text/csv:
 *             schema:
 *               type: string
 *               description: CSV formatted analytics data
 *       500:
 *         description: Failed to export analytics data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * GET /analytics/export - Export analytics data
 */
router.get('/export', async (req, res) => {
    try {
        const format = req.query.format || 'json';
        const summary = await getAnalyticsSummary();
        const allRequests = await getRequestHistory({ limit: 10000 });
        
        const exportData = {
            exportDate: new Date().toISOString(),
            summary: summary.summary,
            performance: summary.performance,
            dailyStats: summary.dailyStats,
            requests: allRequests.requests
        };
        
        if (format === 'csv') {
            // Convert to CSV format
            const csv = convertToCSV(allRequests.requests);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv');
            res.send(csv);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.json');
            res.json(exportData);
        }
        
        logger.info(`📊 Analytics data exported in ${format} format`);
    } catch (error) {
        logger.error(`❌ Error exporting analytics: ${error.message}`);
        res.status(500).json({ error: 'Failed to export analytics data' });
    }
});

/**
 * Convert requests data to CSV format
 */
function convertToCSV(requests) {
    const headers = [
        'timestamp', 'method', 'path', 'statusCode', 'responseTime', 
        'mockMatched', 'mockName', 'ip', 'userAgent'
    ];
    
    const csvRows = [headers.join(',')];
    
    requests.forEach(req => {
        const row = [
            req.timestamp.toISOString(),
            req.method,
            `"${req.path}"`,
            req.statusCode,
            req.responseTime || 0,
            req.mockMatched ? 'true' : 'false',
            req.mockMatched ? `"${req.mockMatched.name}"` : '',
            `"${req.ip || ''}"`,
            `"${req.userAgent || ''}"`
        ];
        csvRows.push(row.join(','));
    });
    
    return csvRows.join('\n');
}

module.exports = router;
