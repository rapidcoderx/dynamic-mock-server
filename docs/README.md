# Documentation

This folder contains comprehensive documentation for the Dynamic Mock Server.

## ☸️ Deployment & Operations

- **[HELM_DEPLOYMENT.md](./HELM_DEPLOYMENT.md)** - Complete Helm deployment guide with multi-environment support
- **[KUBERNETES_DEPLOYMENT.md](./KUBERNETES_DEPLOYMENT.md)** - Raw Kubernetes manifests and deployment guide
- **[MVP_RELEASE_CHECKLIST.md](./MVP_RELEASE_CHECKLIST.md)** - MVP release preparation checklist
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes
- **[RELEASE_NOTES.md](./RELEASE_NOTES.md)** - Latest release information

## 📊 Analytics & Monitoring

- **[ANALYTICS_IMPLEMENTATION.md](./ANALYTICS_IMPLEMENTATION.md)** - Complete analytics dashboard implementation guide
- **[ANALYTICS_FILTERING.md](./ANALYTICS_FILTERING.md)** - How analytics filtering works and what gets tracked
- **[POSTGRESQL_ANALYTICS_SOLUTION.md](./POSTGRESQL_ANALYTICS_SOLUTION.md)** - PostgreSQL integration for persistent analytics
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - High-level summary of all implemented features

## 🗄️ Storage & Database

- **[DATABASE_STORAGE.md](./DATABASE_STORAGE.md)** - Database storage configuration and setup

## 🎛️ Advanced Features

- **[DYNAMIC_VALUES_AND_DELAYS.md](./DYNAMIC_VALUES_AND_DELAYS.md)** - Dynamic response generation and delays
- **[DYNAMIC_VALUES_CHEAT_SHEET.md](./DYNAMIC_VALUES_CHEAT_SHEET.md)** - Quick reference for dynamic placeholders
- **[HEADER_ROUTING.md](./HEADER_ROUTING.md)** - Header-based request routing
- **[QUERY_PARAMETER_ROUTING.md](./QUERY_PARAMETER_ROUTING.md)** - Query parameter-based routing

## � Monitoring & Observability

- **[OPENTELEMETRY_METRICS.md](./OPENTELEMETRY_METRICS.md)** - OpenTelemetry and Prometheus metrics implementation
- **[TESTING_OTEL_PROMETHEUS.md](./TESTING_OTEL_PROMETHEUS.md)** - Testing guide for metrics implementation
- **[OTEL_PROMETHEUS_IMPLEMENTATION.md](./OTEL_PROMETHEUS_IMPLEMENTATION.md)** - Implementation summary
- **[JAEGER_TO_OTLP_MIGRATION.md](./JAEGER_TO_OTLP_MIGRATION.md)** - Migration guide from Jaeger to OTLP

## �📚 Additional Resources

- **[../README.md](../README.md)** - Main project documentation
- **[../api-collections/README.md](../api-collections/README.md)** - API collection examples
- **[EXPORT_IMPORT_GUIDE.md](EXPORT_IMPORT_GUIDE.md)** - Mock import/export guide

## 🚀 Quick Start Guide

1. **Basic Setup**: Start with the main [README.md](../README.md)
2. **Dynamic Features**: Check [DYNAMIC_VALUES_CHEAT_SHEET.md](./DYNAMIC_VALUES_CHEAT_SHEET.md)
3. **Analytics**: See [ANALYTICS_FILTERING.md](./ANALYTICS_FILTERING.md) for monitoring
4. **Advanced Routing**: Explore [HEADER_ROUTING.md](./HEADER_ROUTING.md) and [QUERY_PARAMETER_ROUTING.md](./QUERY_PARAMETER_ROUTING.md)
5. **Database Integration**: Configure with [DATABASE_STORAGE.md](./DATABASE_STORAGE.md)

## 🔧 Implementation Details

For developers wanting to understand the internals:
- [ANALYTICS_IMPLEMENTATION.md](./ANALYTICS_IMPLEMENTATION.md) - Detailed analytics architecture
- [POSTGRESQL_ANALYTICS_SOLUTION.md](./POSTGRESQL_ANALYTICS_SOLUTION.md) - Database schema and queries
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Overall system architecture
