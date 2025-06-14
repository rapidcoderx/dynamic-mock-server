# OpenTelemetry and Prometheus Metrics Implementation

## Overview

This document describes the OpenTelemetry and Prometheus metrics implementation for the Dynamic Mock Server. The implementation provides comprehensive observability including distributed tracing, metrics collection, and monitoring capabilities.

**📌 Note**: OpenTelemetry is **disabled by default** to keep the server lightweight. Enable it via configuration when monitoring is needed.

## Quick Start

### Enable OpenTelemetry

Add to your `.env` file:
```bash
# Enable OpenTelemetry and Prometheus metrics
ENABLE_OTEL=true

# Optional: Enable OTLP tracing (requires collector)
ENABLE_TRACING=false
```

### Default Behavior

When `ENABLE_OTEL=false` (default):
- No OpenTelemetry initialization
- No metrics collection overhead
- No Prometheus endpoints
- Lightweight server operation

When `ENABLE_OTEL=true`:
- Full OpenTelemetry integration
- Prometheus metrics available at `:9464/metrics`
- Optional OTLP tracing support

## Features

### 🔍 OpenTelemetry Integration
- **Distributed Tracing**: Track requests across service boundaries
- **Auto-instrumentation**: Automatic instrumentation for HTTP, Express, MongoDB, and PostgreSQL
- **Custom Spans**: Manual span creation for specific operations
- **OTLP Export**: Modern OpenTelemetry Protocol export for traces (replaces deprecated Jaeger)

### 📊 Prometheus Metrics
- **HTTP Request Metrics**: Duration, count, size tracking
- **Mock-Specific Metrics**: Hit counts, response times, configuration changes
- **Storage Metrics**: Database operation performance
- **System Metrics**: Node.js process metrics, memory, CPU usage
- **Analytics Metrics**: Event processing statistics

### 🎯 Custom Metrics Dashboard
- **Health Checks**: Metrics system health monitoring
- **Summary Views**: Human-readable metrics summaries
- **Real-time Updates**: Live metrics updates

## Architecture

### Components

1. **Tracer Module** (`server/tracer.js`)
   - OpenTelemetry SDK initialization
   - Jaeger exporter configuration
   - Prometheus exporter setup

2. **Metrics Module** (`server/metrics.js`)
   - Custom metrics definitions
   - OpenTelemetry meter setup
   - Prometheus client integration

3. **Metrics Middleware** (`server/middleware/metrics.js`)
   - Request/response tracking
   - Span management
   - Error tracking

4. **Metrics Routes** (`server/routes/metricsRoutes.js`)
   - `/metrics` - Metrics information
   - `/metrics/prometheus` - Prometheus format metrics
   - `/metrics/health` - Metrics system health
   - `/metrics/summary` - Human-readable summary

## Available Metrics

### HTTP Metrics
```
http_requests_total - Total HTTP requests counter
http_request_duration_seconds - Request duration histogram
http_request_size_bytes - Request size histogram
http_response_size_bytes - Response size histogram
```

### Mock-Specific Metrics
```
mock_hits_total - Total mock hits counter
mock_response_time_seconds - Mock response time histogram
mock_configs_total - Total configured mocks gauge
mock_processing_errors_total - Mock processing errors counter
```

### Storage Metrics
```
storage_operation_duration_seconds - Storage operation duration
storage_connections_active - Active storage connections
```

### Analytics Metrics
```
analytics_events_total - Analytics events processed
```

### System Metrics (Auto-collected)
```
nodejs_* - Node.js process metrics
process_* - Process-level metrics
dynamic_mock_server_* - Application-specific metrics
```

## Configuration

### Environment Variables

```bash
# OpenTelemetry Configuration
ENABLE_OTEL=true
OTEL_SERVICE_NAME=dynamic-mock-server
OTEL_SERVICE_VERSION=1.0.0

# OTLP Tracing (Optional)
ENABLE_TRACING=false
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces

# Prometheus Configuration
PROMETHEUS_PORT=9464
PROMETHEUS_ENDPOINT=/metrics
```

### Dependencies

The following packages are automatically installed:

```json
{
  "@opentelemetry/api": "^1.9.0",
  "@opentelemetry/auto-instrumentations-node": "^0.60.1",
  "@opentelemetry/exporter-prometheus": "^0.202.0",
  "@opentelemetry/instrumentation-express": "^0.51.0",
  "@opentelemetry/instrumentation-http": "^0.202.0",
  "@opentelemetry/resources": "^2.0.1",
  "@opentelemetry/sdk-metrics": "^2.0.1",
  "@opentelemetry/sdk-node": "^0.202.0",
  "@opentelemetry/semantic-conventions": "^1.34.0",
  "prom-client": "^15.1.3"
}
```

Optional for tracing:
```json
{
  "@opentelemetry/exporter-trace-otlp-http": "^0.55.0"
}
```

## Usage

### Starting the Server

The OpenTelemetry tracer is automatically initialized when the server starts:

```bash
npm start
```

You'll see output like:
```
🔍 OpenTelemetry initialized successfully
📊 Prometheus metrics available at http://localhost:9464/metrics
🚀 Server running at http://localhost:8080/api/
```

### Accessing Metrics

#### Prometheus Metrics Endpoint
```bash
curl http://localhost:8080/api/metrics/prometheus
```

#### Metrics Information
```bash
curl http://localhost:8080/api/metrics
```

#### Metrics Health Check
```bash
curl http://localhost:8080/api/metrics/health
```

#### Human-Readable Summary
```bash
curl http://localhost:8080/api/metrics/summary
```

### Integration with Monitoring Systems

#### Prometheus Scraping

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'dynamic-mock-server'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/api/metrics/prometheus'
    scrape_interval: 15s

  # Alternative: Direct metrics port
  - job_name: 'dynamic-mock-server-direct'
    static_configs:
      - targets: ['localhost:9464']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

#### Grafana Dashboard

Import metrics using these common queries:

```promql
# HTTP Request Rate
rate(http_requests_total[5m])

# Request Duration 95th Percentile
histogram_quantile(0.95, http_request_duration_seconds_bucket)

# Mock Hit Rate
rate(mock_hits_total[5m])

# Error Rate
rate(http_requests_total{status_code!~"2.."}[5m])
```

#### OTLP Tracing (Optional)

OTLP (OpenTelemetry Protocol) is the modern standard for trace export:

1. **Option 1: Jaeger with OTLP**
```bash
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 14250:14250 \
  -p 4317:4317 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest
```

2. **Option 2: OTEL Collector**
```bash
# Use OpenTelemetry Collector with your preferred backend
docker run -d --name otel-collector \
  -p 4317:4317 \
  -p 4318:4318 \
  otel/opentelemetry-collector-contrib
```

3. **Enable tracing in environment:**
```bash
ENABLE_TRACING=true
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
```

4. **Install optional dependency:**
```bash
npm install @opentelemetry/exporter-trace-otlp-http
```

5. **Access traces**: 
   - Jaeger UI: http://localhost:16686
   - Or your configured tracing backend

## Monitoring Examples

### Mock Performance Analysis
```bash
# Get mock hit statistics
curl http://localhost:8080/api/metrics/prometheus | grep mock_hits_total

# Check mock response times
curl http://localhost:8080/api/metrics/prometheus | grep mock_response_time
```

### System Health Monitoring
```bash
# Check overall system health
curl http://localhost:8080/api/metrics/health

# Monitor memory usage
curl http://localhost:8080/api/metrics/prometheus | grep nodejs_heap
```

### Request Monitoring
```bash
# Monitor HTTP request patterns
curl http://localhost:8080/api/metrics/prometheus | grep http_requests_total

# Check response times
curl http://localhost:8080/api/metrics/prometheus | grep http_request_duration
```

## Troubleshooting

### Common Issues

1. **Metrics not appearing**
   - Check that `ENABLE_OTEL=true` in environment
   - Verify server startup logs for initialization messages
   - Ensure `/api/metrics/health` returns healthy status

2. **High memory usage**
   - Metrics are collected in-memory; consider adjusting retention
   - Monitor `nodejs_heap_used_bytes` metric
   - Check analytics retention settings

3. **Prometheus scraping fails**
   - Verify metrics endpoint accessibility
   - Check network connectivity
   - Validate Prometheus configuration

4. **Jaeger traces not appearing**
   - Ensure `ENABLE_JAEGER=true`
   - Verify Jaeger server is running
   - Check Jaeger endpoint configuration

### Performance Considerations

- **Metrics Collection**: Minimal overhead (~1-2ms per request)
- **Memory Usage**: Metrics are stored in-memory with automatic cleanup
- **Storage Impact**: Database metrics add minimal query overhead
- **Network**: Prometheus scraping generates additional HTTP requests

## Integration with Existing Analytics

The metrics system works alongside the existing analytics system:

- **Analytics**: Detailed request logging and storage
- **Metrics**: Aggregated performance and usage statistics
- **Complementary**: Both systems provide different insights

The analytics system continues to store detailed request information while metrics provide real-time aggregated data for monitoring and alerting.

## Future Enhancements

- [ ] Custom alerting rules
- [ ] Advanced dashboard templates
- [ ] Metrics data retention policies
- [ ] Additional exporters (DataDog, New Relic)
- [ ] Custom metric aggregations
- [ ] Performance benchmarking metrics
