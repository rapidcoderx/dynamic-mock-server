#!/usr/bin/env node

/**
 * OpenTelemetry and Prometheus Metrics Test Script
 * 
 * This script validates the proper functioning of:
 * - OpenTelemetry initialization
 * - Prometheus metrics collection
 * - Metrics endpoints accessibility
 * - Custom metrics functionality
 * - Integration with existing analytics
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    serverPort: process.env.PORT || 8080,
    apiPrefix: process.env.API_PREFIX || '/api',
    prometheusPort: process.env.PROMETHEUS_PORT || 9464,
    testTimeout: 30000, // 30 seconds
    serverStartTimeout: 10000, // 10 seconds for server to start
};

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    errors: []
};

// Color codes for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, colors.green);
    testResults.passed++;
}

function logError(message, error = null) {
    log(`❌ ${message}`, colors.red);
    if (error) {
        log(`   Error: ${error.message}`, colors.red);
        testResults.errors.push({ message, error: error.message });
    }
    testResults.failed++;
}

function logInfo(message) {
    log(`ℹ️  ${message}`, colors.cyan);
}

function logWarn(message) {
    log(`⚠️  ${message}`, colors.yellow);
}

// HTTP request helper
function makeRequest(options) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });

        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        if (options.data) {
            req.write(options.data);
        }
        req.end();
    });
}

// Test functions
async function testServerHealth() {
    logInfo('Testing server health...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: TEST_CONFIG.serverPort,
            path: `${TEST_CONFIG.apiPrefix}/health`,
            method: 'GET'
        });

        if (response.statusCode === 200) {
            const healthData = JSON.parse(response.data);
            if (healthData.status === 'ok') {
                logSuccess('Server health check passed');
                return true;
            } else {
                logError('Server health check failed - status not ok');
                return false;
            }
        } else {
            logError(`Server health check failed - status code: ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        logError('Server health check failed', error);
        return false;
    }
}

async function testMetricsEndpoint() {
    logInfo('Testing metrics endpoint...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: TEST_CONFIG.serverPort,
            path: `${TEST_CONFIG.apiPrefix}/metrics`,
            method: 'GET'
        });

        if (response.statusCode === 200) {
            const metricsInfo = JSON.parse(response.data);
            if (metricsInfo.status === 'active' && metricsInfo.prometheus_endpoint) {
                logSuccess('Metrics endpoint is active');
                return true;
            } else {
                logError('Metrics endpoint response invalid');
                return false;
            }
        } else {
            logError(`Metrics endpoint failed - status code: ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        logError('Metrics endpoint test failed', error);
        return false;
    }
}

async function testPrometheusMetrics() {
    logInfo('Testing Prometheus metrics endpoint...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: TEST_CONFIG.serverPort,
            path: `${TEST_CONFIG.apiPrefix}/metrics/prometheus`,
            method: 'GET'
        });

        if (response.statusCode === 200) {
            const metricsData = response.data;
            
            // Check for essential metrics
            const expectedMetrics = [
                'http_requests_total',
                'http_request_duration_seconds',
                'mock_configs_total',
                'nodejs_heap_used_bytes'
            ];

            const missingMetrics = expectedMetrics.filter(metric => 
                !metricsData.includes(metric)
            );

            if (missingMetrics.length === 0) {
                logSuccess('Prometheus metrics endpoint contains all expected metrics');
                logInfo(`Metrics data size: ${metricsData.length} bytes`);
                return true;
            } else {
                logError(`Missing metrics: ${missingMetrics.join(', ')}`);
                return false;
            }
        } else {
            logError(`Prometheus metrics failed - status code: ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        logError('Prometheus metrics test failed', error);
        return false;
    }
}

async function testMetricsHealth() {
    logInfo('Testing metrics health endpoint...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: TEST_CONFIG.serverPort,
            path: `${TEST_CONFIG.apiPrefix}/metrics/health`,
            method: 'GET'
        });

        if (response.statusCode === 200) {
            const healthData = JSON.parse(response.data);
            if (healthData.status === 'healthy' && healthData.prometheus_active) {
                logSuccess('Metrics health check passed');
                logInfo(`OpenTelemetry active: ${healthData.opentelemetry_active}`);
                logInfo(`Uptime: ${Math.round(healthData.uptime_seconds)} seconds`);
                return true;
            } else {
                logError('Metrics health check failed - system not healthy');
                return false;
            }
        } else {
            logError(`Metrics health failed - status code: ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        logError('Metrics health test failed', error);
        return false;
    }
}

async function testMetricsSummary() {
    logInfo('Testing metrics summary endpoint...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: TEST_CONFIG.serverPort,
            path: `${TEST_CONFIG.apiPrefix}/metrics/summary`,
            method: 'GET'
        });

        if (response.statusCode === 200) {
            const summaryData = JSON.parse(response.data);
            if (summaryData.total_metrics >= 0 && summaryData.system_info) {
                logSuccess('Metrics summary endpoint working');
                logInfo(`Total metrics tracked: ${summaryData.total_metrics}`);
                logInfo(`Memory usage: ${summaryData.system_info.memory_usage_mb} MB`);
                return true;
            } else {
                logError('Metrics summary data invalid');
                return false;
            }
        } else {
            logError(`Metrics summary failed - status code: ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        logError('Metrics summary test failed', error);
        return false;
    }
}

async function testStandalonePrometheusPort() {
    logInfo('Testing standalone Prometheus port...');
    try {
        const response = await makeRequest({
            hostname: 'localhost',
            port: TEST_CONFIG.prometheusPort,
            path: '/metrics',
            method: 'GET'
        });

        if (response.statusCode === 200) {
            const metricsData = response.data;
            if (metricsData.includes('http_requests_total')) {
                logSuccess('Standalone Prometheus port is working');
                return true;
            } else {
                logError('Standalone Prometheus port returned invalid data');
                return false;
            }
        } else {
            logError(`Standalone Prometheus port failed - status code: ${response.statusCode}`);
            return false;
        }
    } catch (error) {
        logWarn('Standalone Prometheus port not accessible (this is optional)');
        logInfo('This is expected if the standalone port is not configured');
        return true; // This is optional, so we don't fail the test
    }
}

async function testMockOperationsMetrics() {
    logInfo('Testing mock operations generate metrics...');
    try {
        // Create a test mock
        const createResponse = await makeRequest({
            hostname: 'localhost',
            port: TEST_CONFIG.serverPort,
            path: `${TEST_CONFIG.apiPrefix}/mocks`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify({
                name: 'Test Mock for Metrics',
                method: 'GET',
                path: '/test-metrics',
                response: { message: 'Metrics test successful' },
                statusCode: 200
            })
        });

        if (createResponse.statusCode === 201) {
            const mockData = JSON.parse(createResponse.data);
            logInfo(`Created test mock: ${mockData.id}`);

            // Make a request to the mock
            const mockResponse = await makeRequest({
                hostname: 'localhost',
                port: TEST_CONFIG.serverPort,
                path: '/test-metrics',
                method: 'GET'
            });

            if (mockResponse.statusCode === 200) {
                logInfo('Mock request completed');

                // Wait a moment for metrics to be collected
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Check if metrics were updated
                const metricsResponse = await makeRequest({
                    hostname: 'localhost',
                    port: TEST_CONFIG.serverPort,
                    path: `${TEST_CONFIG.apiPrefix}/metrics/prometheus`,
                    method: 'GET'
                });

                if (metricsResponse.statusCode === 200 && 
                    metricsResponse.data.includes('mock_hits_total')) {
                    logSuccess('Mock operations generate metrics correctly');

                    // Clean up - delete the test mock
                    await makeRequest({
                        hostname: 'localhost',
                        port: TEST_CONFIG.serverPort,
                        path: `${TEST_CONFIG.apiPrefix}/mocks/${mockData.id}`,
                        method: 'DELETE'
                    });
                    
                    return true;
                } else {
                    logError('Mock metrics not found in Prometheus output');
                    return false;
                }
            } else {
                logError('Failed to call test mock');
                return false;
            }
        } else {
            logError('Failed to create test mock');
            return false;
        }
    } catch (error) {
        logError('Mock operations metrics test failed', error);
        return false;
    }
}

async function testOpenTelemetryIntegration() {
    logInfo('Testing OpenTelemetry integration...');
    try {
        // Make some requests to generate traces
        const requests = [
            makeRequest({
                hostname: 'localhost',
                port: TEST_CONFIG.serverPort,
                path: `${TEST_CONFIG.apiPrefix}/health`,
                method: 'GET'
            }),
            makeRequest({
                hostname: 'localhost',
                port: TEST_CONFIG.serverPort,
                path: `${TEST_CONFIG.apiPrefix}/config`,
                method: 'GET'
            }),
            makeRequest({
                hostname: 'localhost',
                port: TEST_CONFIG.serverPort,
                path: `${TEST_CONFIG.apiPrefix}/mocks`,
                method: 'GET'
            })
        ];

        const responses = await Promise.all(requests);
        const successfulRequests = responses.filter(r => r.statusCode < 400).length;

        if (successfulRequests === requests.length) {
            // Check if traces are being generated (by looking for trace headers or spans)
            const metricsResponse = await makeRequest({
                hostname: 'localhost',
                port: TEST_CONFIG.serverPort,
                path: `${TEST_CONFIG.apiPrefix}/metrics/prometheus`,
                method: 'GET'
            });

            if (metricsResponse.statusCode === 200) {
                const metricsData = metricsResponse.data;
                // Look for OpenTelemetry-related metrics
                if (metricsData.includes('http_requests_total') && 
                    metricsData.includes('http_request_duration')) {
                    logSuccess('OpenTelemetry integration is working (metrics generated)');
                    return true;
                } else {
                    logError('OpenTelemetry metrics not found');
                    return false;
                }
            } else {
                logError('Could not retrieve metrics to verify OpenTelemetry');
                return false;
            }
        } else {
            logError('Some test requests failed during OpenTelemetry test');
            return false;
        }
    } catch (error) {
        logError('OpenTelemetry integration test failed', error);
        return false;
    }
}

// Main test runner
async function runTests() {
    log(`${colors.bold}🧪 OpenTelemetry and Prometheus Metrics Test Suite${colors.reset}`);
    log(`${colors.cyan}==================================================${colors.reset}`);
    
    logInfo('Starting server validation tests...');
    logInfo(`Server: http://localhost:${TEST_CONFIG.serverPort}${TEST_CONFIG.apiPrefix}`);
    logInfo(`Prometheus: http://localhost:${TEST_CONFIG.prometheusPort}/metrics`);
    
    console.log();

    // Wait a moment for server to be ready
    logInfo('Waiting for server to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Run all tests
    const tests = [
        { name: 'Server Health', fn: testServerHealth },
        { name: 'Metrics Endpoint', fn: testMetricsEndpoint },
        { name: 'Prometheus Metrics', fn: testPrometheusMetrics },
        { name: 'Metrics Health', fn: testMetricsHealth },
        { name: 'Metrics Summary', fn: testMetricsSummary },
        { name: 'Standalone Prometheus Port', fn: testStandalonePrometheusPort },
        { name: 'Mock Operations Metrics', fn: testMockOperationsMetrics },
        { name: 'OpenTelemetry Integration', fn: testOpenTelemetryIntegration }
    ];

    for (const test of tests) {
        log(`\n${colors.yellow}Running: ${test.name}${colors.reset}`);
        try {
            await test.fn();
        } catch (error) {
            logError(`Test "${test.name}" crashed`, error);
        }
    }

    // Print results
    console.log();
    log(`${colors.bold}📊 Test Results${colors.reset}`);
    log(`${colors.cyan}===============${colors.reset}`);
    log(`✅ Passed: ${testResults.passed}`, colors.green);
    log(`❌ Failed: ${testResults.failed}`, colors.red);
    log(`📝 Total:  ${testResults.passed + testResults.failed}`);

    if (testResults.failed > 0) {
        console.log();
        log(`${colors.bold}❌ Failed Tests Details:${colors.reset}`);
        testResults.errors.forEach((error, index) => {
            log(`${index + 1}. ${error.message}`, colors.red);
            log(`   ${error.error}`, colors.red);
        });
    }

    console.log();
    if (testResults.failed === 0) {
        log(`${colors.bold}🎉 All tests passed! OpenTelemetry and Prometheus metrics are working correctly.${colors.reset}`, colors.green);
        process.exit(0);
    } else {
        log(`${colors.bold}💥 Some tests failed. Please check the errors above.${colors.reset}`, colors.red);
        process.exit(1);
    }
}

// Start the test
if (require.main === module) {
    runTests().catch(error => {
        logError('Test runner crashed', error);
        process.exit(1);
    });
}

module.exports = {
    runTests,
    testResults,
    TEST_CONFIG
};
