const express = require('express');
const logger = require('../logger');
const { 
    getAnalyticsSummary, 
    getRequestHistory, 
    clearAnalytics 
} = require('../middleware/analytics');

const router = express.Router();

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
