# Migration Notice: Jaeger to OTLP

## 🔄 Breaking Change: Deprecated Jaeger Exporter Replaced

We've updated the OpenTelemetry implementation to use the modern **OTLP (OpenTelemetry Protocol)** instead of the deprecated Jaeger exporter.

### ⚠️ What Changed

1. **Removed**: `@opentelemetry/exporter-jaeger` (deprecated)
2. **Added**: `@opentelemetry/exporter-trace-otlp-http` (optional)
3. **Environment Variables**: Updated from Jaeger-specific to OTLP standard

### 🔧 Migration Steps

#### Old Configuration (Deprecated)
```bash
ENABLE_JAEGER=true
JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

#### New Configuration (Current)
```bash
ENABLE_TRACING=true
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
```

### 🚀 Benefits of OTLP

1. **Future-proof**: OTLP is the official OpenTelemetry standard
2. **Vendor-neutral**: Works with Jaeger, Zipkin, and other backends
3. **Better performance**: More efficient protocol
4. **Standard compliance**: Follows OpenTelemetry specifications

### 📋 Migration Checklist

- [ ] Update environment variables from `ENABLE_JAEGER` to `ENABLE_TRACING`
- [ ] Change endpoint from Jaeger-specific to OTLP format
- [ ] Install optional OTLP exporter: `npm install @opentelemetry/exporter-trace-otlp-http`
- [ ] Update your tracing backend to accept OTLP (if needed)

### 🔗 Backend Compatibility

#### Jaeger (Recommended)
```bash
# Jaeger now supports OTLP natively
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest

# Use OTLP endpoint
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
```

#### OpenTelemetry Collector
```bash
# Universal OTLP collector
docker run -d --name otel-collector \
  -p 4317:4317 \
  -p 4318:4318 \
  otel/opentelemetry-collector-contrib
```

#### Other Backends
- **Zipkin**: Configure OTLP receiver
- **DataDog**: Use DataDog OTLP endpoint
- **New Relic**: Use New Relic OTLP endpoint
- **Custom**: Any OTLP-compatible backend

### 🆘 Troubleshooting

#### "JaegerExporter is deprecated" Warning
✅ **Fixed**: The warning should no longer appear

#### Traces not appearing
1. Verify OTLP exporter is installed: `npm list @opentelemetry/exporter-trace-otlp-http`
2. Check endpoint is correct and accessible
3. Ensure backend supports OTLP protocol

#### Still using old configuration
1. Update `.env` file with new variables
2. Remove old Jaeger-specific configuration
3. Restart the application

### 🎯 No Action Needed For

- **Metrics collection**: Still works the same
- **Prometheus integration**: No changes
- **Basic OpenTelemetry**: Core functionality unchanged
- **Auto-instrumentation**: Still automatic

### 💡 Optional: Enhanced Tracing

With OTLP, you can now easily switch between different tracing backends:

```bash
# Jaeger
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces

# Zipkin via OTEL Collector
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces

# DataDog
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://api.datadoghq.com/otlp/v1/traces

# New Relic
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=https://otlp.nr-data.net/v1/traces
```

### 📞 Support

If you encounter issues during migration:

1. Check the updated documentation in `docs/OPENTELEMETRY_METRICS.md`
2. Run `npm run validate-otel` to verify setup
3. Test with `npm run test-otel`

The migration ensures your observability setup is future-proof and follows current OpenTelemetry best practices! 🚀
