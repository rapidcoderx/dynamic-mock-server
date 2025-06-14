# OpenTelemetry and Prometheus Testing Guide

This guide explains how to test the OpenTelemetry and Prometheus metrics implementation in the Dynamic Mock Server.

## Quick Setup Validation

Before running the full tests, validate that everything is properly set up:

```bash
npm run validate-otel
```

This command will check:
- ✅ All required dependencies are installed
- ✅ OpenTelemetry modules are properly configured
- ✅ Metrics collection is set up correctly
- ✅ Environment configuration is complete

## Full Integration Testing

### Option 1: Automated Test with Server Start

Run the complete test suite that automatically starts the server:

```bash
./tests/scripts/test-otel-prometheus.sh
```

This script will:
1. Install dependencies
2. Start the Dynamic Mock Server
3. Wait for server readiness
4. Run comprehensive tests
5. Clean up automatically

### Option 2: Manual Testing with Running Server

If you have the server already running:

```bash
# Terminal 1 - Start the server
npm start

# Terminal 2 - Run tests
npm run test-otel
```

### Option 3: Individual Test Components

You can also test specific components:

```bash
# Validate setup only
npm run validate-otel

# Test with server running
npm run test-otel
```

## Test Coverage

The test suite validates:

### 🔍 OpenTelemetry Integration
- [x] Service initialization
- [x] Auto-instrumentation setup
- [x] Custom span creation
- [x] Trace context propagation
- [x] Error tracking

### 📊 Prometheus Metrics
- [x] HTTP request metrics
- [x] Mock-specific metrics
- [x] Storage operation metrics
- [x] System metrics collection
- [x] Custom metrics endpoints

### 🔗 Endpoint Testing
- [x] `/api/metrics` - Metrics information
- [x] `/api/metrics/prometheus` - Prometheus format
- [x] `/api/metrics/health` - Health check
- [x] `/api/metrics/summary` - Human-readable summary
- [x] `:9464/metrics` - Standalone Prometheus (optional)

### 🎯 Integration Testing
- [x] Mock creation generates metrics
- [x] Mock hits are tracked
- [x] Configuration changes update counters
- [x] Error tracking works correctly
- [x] Analytics integration

## Expected Test Output

### Successful Test Run
```
🧪 OpenTelemetry and Prometheus Metrics Test Suite
==================================================

ℹ️  Starting server validation tests...
ℹ️  Server: http://localhost:8080/api
ℹ️  Prometheus: http://localhost:9464/metrics

Running: Server Health
ℹ️  Testing server health...
✅ Server health check passed

Running: Metrics Endpoint
ℹ️  Testing metrics endpoint...
✅ Metrics endpoint is active

Running: Prometheus Metrics
ℹ️  Testing Prometheus metrics endpoint...
ℹ️  Metrics data size: 15420 bytes
✅ Prometheus metrics endpoint contains all expected metrics

[... more tests ...]

📊 Test Results
===============
✅ Passed: 8
❌ Failed: 0
📝 Total:  8

🎉 All tests passed! OpenTelemetry and Prometheus metrics are working correctly.
```

### Failed Test Example
```
Running: Prometheus Metrics
ℹ️  Testing Prometheus metrics endpoint...
❌ Missing metrics: mock_hits_total, http_request_duration_seconds

📊 Test Results
===============
✅ Passed: 6
❌ Failed: 2
📝 Total:  8

💥 Some tests failed! Please check the errors above.
```

## Troubleshooting

### Common Issues

1. **Server won't start**
   ```bash
   # Check dependencies
   npm run validate-otel
   
   # Install missing dependencies
   npm install
   ```

2. **Metrics endpoint returns 404**
   - Verify metrics routes are properly imported in `server/index.js`
   - Check if `metricsRoutes` is added to the API router

3. **No metrics data**
   - Ensure `ENABLE_OTEL=true` in environment
   - Check server logs for initialization errors
   - Verify middleware is properly configured

4. **Prometheus format issues**
   - Check `prom-client` version compatibility
   - Verify metric definitions in `server/metrics.js`

5. **OpenTelemetry not working**
   - Ensure tracer is initialized before other imports
   - Check OpenTelemetry package versions
   - Verify auto-instrumentation setup

### Debug Commands

```bash
# Check server health
curl http://localhost:8080/api/health

# Check metrics info
curl http://localhost:8080/api/metrics

# Get raw Prometheus data
curl http://localhost:8080/api/metrics/prometheus

# Check metrics system health
curl http://localhost:8080/api/metrics/health

# Get human-readable summary
curl http://localhost:8080/api/metrics/summary
```

### Log Analysis

Check server logs for these indicators:

**Successful Initialization:**
```
🔍 OpenTelemetry initialized successfully
📊 Prometheus metrics available at http://localhost:9464/metrics
🚀 Server running at http://localhost:8080/api/
```

**Common Errors:**
```
❌ Failed to initialize OpenTelemetry: [error details]
❌ Error collecting metrics: [error details]
```

## Manual Testing Scenarios

### Basic Functionality
1. Start server: `npm start`
2. Create a mock via API
3. Make requests to the mock
4. Check metrics: `curl http://localhost:8080/api/metrics/prometheus`
5. Verify mock hit counters increased

### Performance Testing
1. Create multiple mocks
2. Generate high traffic using tools like `ab` or `wrk`
3. Monitor metrics during load
4. Check for memory leaks or performance degradation

### Error Scenarios
1. Create a mock with dynamic values
2. Cause processing errors
3. Check error metrics in Prometheus output
4. Verify error tracking in spans

## Integration with Monitoring

### Prometheus Configuration
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'dynamic-mock-server'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/api/metrics/prometheus'
    scrape_interval: 15s
```

### Grafana Queries
```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status_code!~"2.."}[5m])

# Mock hit rate
rate(mock_hits_total[5m])

# Response time 95th percentile
histogram_quantile(0.95, http_request_duration_seconds_bucket)
```

### Jaeger Tracing
To test distributed tracing:

1. Start Jaeger: `docker run -p 16686:16686 -p 14268:14268 jaegertracing/all-in-one`
2. Set `ENABLE_JAEGER=true`
3. Restart server
4. Make requests
5. Check traces at `http://localhost:16686`

## Continuous Integration

For CI/CD pipelines, add this to your workflow:

```yaml
- name: Test OpenTelemetry Integration
  run: |
    npm run validate-otel
    ./tests/scripts/test-otel-prometheus.sh
```

This ensures that the metrics implementation is properly tested in every build.
