# Helm Deployment Guide

This document provides comprehensive instructions for deploying the Dynamic Mock Server using Helm charts.

## Overview

The Dynamic Mock Server Helm chart provides a production-ready deployment with:

- **Flexible Configuration**: Support for different environments (development, production, Istio)
- **Database Options**: In-memory, MongoDB, or PostgreSQL storage
- **Monitoring**: Built-in Prometheus metrics and optional ServiceMonitor
- **Security**: Network policies, security contexts, and RBAC
- **Scalability**: Horizontal Pod Autoscaling (HPA)
- **Service Mesh**: Native Istio integration
- **High Availability**: Pod disruption budgets and anti-affinity rules

## Prerequisites

Before deploying, ensure you have:

- **Kubernetes cluster** (v1.19+)
- **Helm** (v3.2.0+)
- **kubectl** configured for your cluster
- **Proper RBAC permissions** for your namespace

### Installing Prerequisites

```bash
# Install Helm (if not already installed)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify installations
helm version
kubectl version --client
kubectl cluster-info
```

## Quick Start

### 1. Basic Development Deployment

Deploy with minimal configuration for development:

```bash
# Using npm script
npm run helm:deploy:dev

# Or directly
./scripts/helm/deploy.sh development
```

### 2. Production Deployment

Deploy with production-ready configuration:

```bash
# Using npm script
npm run helm:deploy:prod

# Or directly
./scripts/helm/deploy.sh production production-namespace dynamic-mock-server-prod
```

### 3. Istio Service Mesh Deployment

Deploy with Istio integration:

```bash
# Using npm script
npm run helm:deploy:istio

# Or directly
./scripts/helm/deploy.sh istio istio-system dynamic-mock-server-istio
```

## Deployment Environments

### Development Environment

**Features:**
- Single replica
- In-memory database
- Relaxed security
- NodePort service for easy access
- Debug logging enabled

**Values file:** `helm/dynamic-mock-server/examples/values-development.yaml`

```bash
./scripts/helm/deploy.sh development dev-namespace
```

### Production Environment

**Features:**
- Multiple replicas with anti-affinity
- PostgreSQL database
- Enhanced security (network policies, security contexts)
- Ingress with TLS
- Resource limits and requests
- Pod disruption budget
- Monitoring enabled

**Values file:** `helm/dynamic-mock-server/examples/values-production.yaml`

```bash
./scripts/helm/deploy.sh production prod-namespace
```

### Istio Environment

**Features:**
- Istio sidecar injection
- Gateway and VirtualService configuration
- Service mesh security
- Distributed tracing ready

**Values file:** `helm/dynamic-mock-server/examples/values-istio.yaml`

```bash
./scripts/helm/deploy.sh istio istio-system
```

## Configuration Options

### Database Configuration

#### In-Memory Database (Development)

```yaml
config:
  database:
    type: "memory"
```

#### MongoDB

```yaml
config:
  database:
    type: "mongodb"
    mongodb:
      uri: "mongodb://mongodb:27017/dynamic_mock_server"
      database: "dynamic_mock_server"
```

#### PostgreSQL

```yaml
config:
  database:
    type: "postgresql"
    postgresql:
      host: "postgresql"
      port: 5432
      database: "dynamic_mock_server"
      username: "postgres"
      password: "secretpassword"
      ssl: true
```

### Ingress Configuration

#### Basic Ingress

```yaml
ingress:
  enabled: true
  className: "nginx"
  hosts:
    - host: api.example.com
      paths:
        - path: /
          pathType: Prefix
```

#### Ingress with TLS

```yaml
ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
  hosts:
    - host: api.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: dynamic-mock-server-tls
      hosts:
        - api.example.com
```

### Monitoring Configuration

#### Prometheus ServiceMonitor

```yaml
serviceMonitor:
  enabled: true
  namespace: "monitoring"
  interval: 30s
  path: /metrics
  labels:
    prometheus: kube-prometheus
```

### Security Configuration

#### Network Policies

```yaml
networkPolicy:
  enabled: true
  ingress:
    enabled: true
    from:
      - namespaceSelector:
          matchLabels:
            name: ingress-nginx
  egress:
    enabled: true
    to:
      - namespaceSelector:
          matchLabels:
            name: database
```

#### Security Context

```yaml
podSecurityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 2000

securityContext:
  allowPrivilegeEscalation: false
  capabilities:
    drop:
    - ALL
  readOnlyRootFilesystem: false
  runAsNonRoot: true
  runAsUser: 1000
```

### Scaling Configuration

#### Manual Scaling

```yaml
replicaCount: 3
autoscaling:
  enabled: false
```

#### Auto Scaling

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
  targetMemoryUtilizationPercentage: 80
```

## Advanced Deployments

### Custom Values File

Create a custom values file for your specific needs:

```yaml
# values-custom.yaml
replicaCount: 2

image:
  tag: "1.0.0"

config:
  database:
    type: "postgresql"
    postgresql:
      host: "my-postgres"
      username: "myuser"
      password: "mypassword"

ingress:
  enabled: true
  hosts:
    - host: my-api.company.com
      paths:
        - path: /
          pathType: Prefix

resources:
  requests:
    memory: 256Mi
    cpu: 250m
  limits:
    memory: 512Mi
    cpu: 500m
```

Deploy with custom values:

```bash
helm upgrade --install my-mock-server ./helm/dynamic-mock-server \
  --namespace my-namespace \
  --create-namespace \
  --values values-custom.yaml
```

### Multi-Environment Deployment

Deploy to multiple environments with different configurations:

```bash
# Development
helm upgrade --install mock-server-dev ./helm/dynamic-mock-server \
  --namespace development \
  --values helm/dynamic-mock-server/examples/values-development.yaml

# Staging
helm upgrade --install mock-server-staging ./helm/dynamic-mock-server \
  --namespace staging \
  --values values-staging.yaml

# Production
helm upgrade --install mock-server-prod ./helm/dynamic-mock-server \
  --namespace production \
  --values helm/dynamic-mock-server/examples/values-production.yaml
```

## Operations

### Deployment Commands

```bash
# Install/upgrade with default values
helm upgrade --install dynamic-mock-server ./helm/dynamic-mock-server

# Install with specific values file
helm upgrade --install dynamic-mock-server ./helm/dynamic-mock-server \
  --values values-production.yaml

# Install with inline value overrides
helm upgrade --install dynamic-mock-server ./helm/dynamic-mock-server \
  --set replicaCount=3 \
  --set config.database.type=postgresql

# Install to specific namespace
helm upgrade --install dynamic-mock-server ./helm/dynamic-mock-server \
  --namespace production \
  --create-namespace
```

### Monitoring and Troubleshooting

```bash
# Check deployment status
helm status dynamic-mock-server

# View deployment history
helm history dynamic-mock-server

# Get all resources
kubectl get all -l app.kubernetes.io/instance=dynamic-mock-server

# Check pod logs
kubectl logs -f deployment/dynamic-mock-server

# Check pod status
kubectl describe pod -l app.kubernetes.io/name=dynamic-mock-server

# Port forward for local access
kubectl port-forward svc/dynamic-mock-server 8080:8080
```

### Testing

```bash
# Run Helm tests
helm test dynamic-mock-server

# Manual health check
kubectl port-forward svc/dynamic-mock-server 8080:8080 &
curl http://localhost:8080/api/health

# Check metrics
kubectl port-forward svc/dynamic-mock-server 9464:9464 &
curl http://localhost:9464/metrics
```

### Upgrades

```bash
# Upgrade to new version
helm upgrade dynamic-mock-server ./helm/dynamic-mock-server \
  --set image.tag=1.1.0

# Rollback to previous version
helm rollback dynamic-mock-server 1

# Show upgrade diff (with helm-diff plugin)
helm diff upgrade dynamic-mock-server ./helm/dynamic-mock-server \
  --values new-values.yaml
```

### Cleanup

```bash
# Using cleanup script
./scripts/helm/cleanup.sh

# Manual cleanup
helm uninstall dynamic-mock-server

# Cleanup with namespace
helm uninstall dynamic-mock-server --namespace production
kubectl delete namespace production
```

## Best Practices

### 1. Resource Management

- Always set resource requests and limits
- Use appropriate resource values for your workload
- Monitor resource usage and adjust as needed

```yaml
resources:
  requests:
    memory: 256Mi
    cpu: 250m
  limits:
    memory: 512Mi
    cpu: 500m
```

### 2. Security

- Enable security contexts
- Use network policies in production
- Keep secrets encrypted and use proper RBAC
- Regular security updates

### 3. High Availability

- Use multiple replicas
- Configure pod disruption budgets
- Use anti-affinity rules
- Spread across availability zones

```yaml
replicaCount: 3
podDisruptionBudget:
  enabled: true
  minAvailable: 2

affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
    - weight: 100
      podAffinityTerm:
        labelSelector:
          matchExpressions:
          - key: app.kubernetes.io/name
            operator: In
            values:
            - dynamic-mock-server
        topologyKey: kubernetes.io/hostname
```

### 4. Monitoring

- Enable ServiceMonitor for Prometheus
- Set up alerting rules
- Monitor application and infrastructure metrics
- Use distributed tracing with Istio

### 5. Database

- Use persistent storage for production
- Regular backups
- Monitor database performance
- Use connection pooling

## Troubleshooting

### Common Issues

#### 1. Pod Not Starting

```bash
# Check pod events
kubectl describe pod -l app.kubernetes.io/name=dynamic-mock-server

# Check logs
kubectl logs -l app.kubernetes.io/name=dynamic-mock-server --previous

# Common causes:
# - Image pull errors
# - Resource constraints
# - Configuration errors
```

#### 2. Service Not Accessible

```bash
# Check service
kubectl get svc dynamic-mock-server

# Check endpoints
kubectl get endpoints dynamic-mock-server

# Test connectivity
kubectl run test-pod --image=busybox --rm -it -- sh
# Inside pod: wget -qO- http://dynamic-mock-server:8080/api/health
```

#### 3. Database Connection Issues

```bash
# Check database configuration
kubectl get configmap dynamic-mock-server-config -o yaml

# Check secrets
kubectl get secret dynamic-mock-server-secrets -o yaml

# Test database connectivity
kubectl exec -it deployment/dynamic-mock-server -- sh
# Inside pod: test database connection
```

#### 4. Ingress Issues

```bash
# Check ingress
kubectl get ingress dynamic-mock-server

# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Test DNS resolution
nslookup your-domain.com
```

### Performance Tuning

#### 1. Resource Optimization

Monitor and adjust resources based on usage:

```bash
# Check resource usage
kubectl top pods -l app.kubernetes.io/name=dynamic-mock-server

# Adjust resources in values file
resources:
  requests:
    memory: 512Mi  # Increase if seeing OOM
    cpu: 500m      # Increase if seeing CPU throttling
```

#### 2. Database Optimization

For PostgreSQL production setups:

```yaml
config:
  database:
    postgresql:
      # Connection pool settings
      max_connections: 100
      shared_buffers: 256MB
      effective_cache_size: 1GB
```

#### 3. Auto Scaling

Fine-tune HPA settings:

```yaml
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 70  # Lower for faster scaling
  targetMemoryUtilizationPercentage: 70
```

## Migration Guide

### From Kubernetes Manifests to Helm

If you're migrating from plain Kubernetes manifests:

1. **Export current configuration:**
   ```bash
   kubectl get deployment dynamic-mock-server -o yaml > current-deployment.yaml
   kubectl get service dynamic-mock-server -o yaml > current-service.yaml
   ```

2. **Create custom values file** based on current configuration

3. **Deploy with Helm:**
   ```bash
   helm upgrade --install dynamic-mock-server ./helm/dynamic-mock-server \
     --values custom-values.yaml
   ```

4. **Cleanup old resources** if needed

### Version Upgrades

When upgrading the application version:

1. **Update image tag** in values file
2. **Check for breaking changes** in release notes
3. **Test in staging** environment first
4. **Perform rolling update** in production

```bash
helm upgrade dynamic-mock-server ./helm/dynamic-mock-server \
  --set image.tag=1.1.0 \
  --wait
```

## Support and Resources

- **GitHub Repository**: https://github.com/rapidcoderx/dynamic-mock-server
- **Helm Documentation**: https://helm.sh/docs/
- **Kubernetes Documentation**: https://kubernetes.io/docs/
- **Issues and Support**: GitHub Issues section

For additional help, please check the project documentation or create an issue on GitHub.
