const http = require('http');
const path = require('path');
const fs = require('fs');

// Simple demo server to test analytics dashboard
const PORT = 3001;

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/demo') {
        // Serve a simple demo page
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Analytics Demo</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #1f2937; color: white; }
                .demo-box { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; }
                .success { color: #10b981; }
                .info { color: #3b82f6; }
                .warning { color: #f59e0b; }
            </style>
        </head>
        <body>
            <h1>🚀 Dynamic Mock Server - Analytics Implementation</h1>
            
            <div class="demo-box">
                <h2 class="success">✅ Implementation Completed</h2>
                <p>The following analytics features have been successfully implemented:</p>
            </div>

            <div class="demo-box">
                <h3 class="info">📊 Usage Dashboard</h3>
                <ul>
                    <li><strong>Mock Hit Statistics:</strong> Tracks which mocks are being used most frequently</li>
                    <li><strong>Response Time Metrics:</strong> Monitors performance with distribution charts</li>
                    <li><strong>Status Code Analysis:</strong> Shows success/error rates across requests</li>
                    <li><strong>Daily Trends:</strong> Historical view of usage patterns over time</li>
                    <li><strong>Real-time Metrics:</strong> Live updates of server performance</li>
                </ul>
            </div>

            <div class="demo-box">
                <h3 class="info">📈 Request History</h3>
                <ul>
                    <li><strong>Comprehensive Logging:</strong> Every request is tracked with full details</li>
                    <li><strong>Advanced Filtering:</strong> Search by method, path, status, date range</li>
                    <li><strong>Pagination:</strong> Handle large volumes of request data efficiently</li>
                    <li><strong>Export Capabilities:</strong> Download request history as CSV or JSON</li>
                    <li><strong>Mock Correlation:</strong> See which requests matched which mocks</li>
                </ul>
            </div>

            <div class="demo-box">
                <h3 class="info">⚡ Performance Metrics</h3>
                <ul>
                    <li><strong>Response Time Tracking:</strong> Monitor API performance over time</li>
                    <li><strong>Performance Distribution:</strong> Visual breakdown of response times</li>
                    <li><strong>Bottleneck Identification:</strong> Spot slow endpoints quickly</li>
                    <li><strong>Performance Insights:</strong> Analyze trends and patterns</li>
                    <li><strong>Real-time Monitoring:</strong> Live performance data updates</li>
                </ul>
            </div>

            <div class="demo-box">
                <h3 class="warning">🔧 Technical Implementation</h3>
                <p><strong>Backend Features:</strong></p>
                <ul>
                    <li>Analytics middleware for automatic request tracking</li>
                    <li>RESTful API endpoints for analytics data (/api/analytics/*)</li>
                    <li>Efficient in-memory storage with configurable limits</li>
                    <li>Export functionality (JSON/CSV formats)</li>
                    <li>Performance-optimized data structures</li>
                </ul>
                
                <p><strong>Frontend Features:</strong></p>
                <ul>
                    <li>Tabbed interface with Mock Management, Dashboard, and History</li>
                    <li>Interactive charts and visualizations</li>
                    <li>Real-time data updates with refresh capabilities</li>
                    <li>Responsive design with glassmorphism UI</li>
                    <li>Advanced filtering and search functionality</li>
                </ul>
            </div>

            <div class="demo-box">
                <h3 class="success">🎯 Usage Instructions</h3>
                <ol>
                    <li>Start the server: <code>npm start</code></li>
                    <li>Open the web interface: <code>http://localhost:8080/api/</code></li>
                    <li>Create some mocks using the "Mock Management" tab</li>
                    <li>Make requests to your mock endpoints to generate analytics data</li>
                    <li>View analytics in the "Analytics Dashboard" tab</li>
                    <li>Explore detailed request history in the "Request History" tab</li>
                </ol>
            </div>

            <div class="demo-box">
                <h3 class="info">🔗 API Endpoints</h3>
                <ul>
                    <li><code>GET /api/analytics/summary</code> - Overview statistics</li>
                    <li><code>GET /api/analytics/dashboard</code> - Complete dashboard data</li>
                    <li><code>GET /api/analytics/requests</code> - Request history with filtering</li>
                    <li><code>GET /api/analytics/performance</code> - Performance metrics</li>
                    <li><code>GET /api/analytics/export</code> - Export analytics data</li>
                    <li><code>DELETE /api/analytics</code> - Clear analytics data</li>
                </ul>
            </div>

            <script>
                // Auto-refresh this demo page every 30 seconds
                setTimeout(() => location.reload(), 30000);
            </script>
        </body>
        </html>
        `);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
});

server.listen(PORT, () => {
    console.log(`📊 Analytics Demo running at http://localhost:${PORT}/demo`);
});
