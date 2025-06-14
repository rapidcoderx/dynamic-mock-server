# Kubernetes Deployment Guide

This guide covers deploying the Dynamic Mock Server to Kubernetes with Docker containerization.

## 🐳 Docker Setup

### Building the Image

```bash
# Build Docker image
npm run docker:build

# Or manually
docker build -t rapidcoderx/dynamic-mock-server:1.0.0-mvp .
```

### Running Locally with Docker

```bash
# Run with Docker
npm run docker:run

# Or manually with environment variables
docker run -p 8080:8080 -p 9464:9464 \
  -e ENABLE_OTEL=true \
  -e STORAGE_TYPE=file \
  rapidcoderx/dynamic-mock-server:1.0.0-mvp
```

## ☸️ Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (v1.19+)
- kubectl configured
- Docker registry access
- Optional: Istio service mesh

### Quick Deployment

```bash
# Deploy to Kubernetes
npm run k8s:deploy

# Or manually
./scripts/k8s/deploy.sh
```

### Manual Deployment Steps

1. **Create Namespace and RBAC:**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/rbac.yaml
   ```

2. **Configure Application:**
   ```bash
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secrets.yaml
   ```

3. **Deploy Application:**
   ```bash
   kubectl apply -f k8s/pvc.yaml
   kubectl apply -f k8s/service.yaml
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/hpa.yaml
   ```

4. **Optional - Istio Setup:**
   ```bash
   kubectl apply -f k8s/istio-gateway.yaml
   kubectl apply -f k8s/istio-virtualservice.yaml
   ```

## ⚙️ Configuration

### Environment Variables

Configure via `k8s/configmap.yaml`:

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_TYPE` | `file` | Storage backend (file/postgresql/mongodb) |
| `ENABLE_OTEL` | `false` | Enable OpenTelemetry metrics |
| `ENABLE_ANALYTICS` | `true` | Enable analytics tracking |
| `PORT` | `8080` | Application port |
| `API_PREFIX` | `/api` | API route prefix |

### Database Configuration

For PostgreSQL/MongoDB, update secrets in `k8s/secrets.yaml`:

```yaml
stringData:
  postgres-host: "your-postgres-host"
  postgres-user: "your-username"
  postgres-password: "your-password"
  postgres-db: "dynamic_mock_server"
```

Then update ConfigMap:
```yaml
data:
  STORAGE_TYPE: "postgresql"
```

## 🌐 Access Methods

### 1. Port Forward (Development)
```bash
kubectl port-forward svc/dynamic-mock-server 8080:8080 -n dynamic-mock-server
# Access: http://localhost:8080
```

### 2. Istio Gateway (Production)
```bash
# Add to /etc/hosts:
# <INGRESS_IP> mock-server.local

# Access: http://mock-server.local
```

### 3. LoadBalancer Service
Update `k8s/service.yaml`:
```yaml
spec:
  type: LoadBalancer  # Change from ClusterIP
```

## 📊 Monitoring

### Health Checks
- **Liveness:** `GET /api/health`
- **Readiness:** `GET /api/health`

### Metrics (when ENABLE_OTEL=true)
- **Prometheus:** `http://pod-ip:9464/metrics`
- **Application metrics:** `GET /api/metrics`

### Kubernetes Commands
```bash
# View pods
kubectl get pods -n dynamic-mock-server

# Check logs
kubectl logs -f deployment/dynamic-mock-server -n dynamic-mock-server

# Check autoscaling
kubectl describe hpa dynamic-mock-server-hpa -n dynamic-mock-server

# Monitor resources
kubectl top pods -n dynamic-mock-server
```

## 🔧 Scaling

### Horizontal Pod Autoscaler
The HPA automatically scales based on:
- CPU utilization (70% target)
- Memory utilization (80% target)
- Min replicas: 2
- Max replicas: 10

### Manual Scaling
```bash
kubectl scale deployment dynamic-mock-server --replicas=5 -n dynamic-mock-server
```

## 🛡️ Security

### RBAC
- Service account with minimal permissions
- Read-only access to pods/services/endpoints

### Network Policies
Create network policies for additional security:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: dynamic-mock-server-netpol
  namespace: dynamic-mock-server
spec:
  podSelector:
    matchLabels:
      app: dynamic-mock-server
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: istio-system
    ports:
    - protocol: TCP
      port: 8080
```

## 🗄️ Persistent Storage

### File Storage (Default)
- Uses PersistentVolumeClaim for mock data
- 1GB storage by default
- Survives pod restarts

### Database Storage
For production, use external databases:
- **PostgreSQL:** Managed service (AWS RDS, Google Cloud SQL)
- **MongoDB:** Managed service (MongoDB Atlas, Azure Cosmos DB)

## 🔄 Updates and Rollbacks

### Rolling Updates
```bash
# Update image
kubectl set image deployment/dynamic-mock-server \
  dynamic-mock-server=rapidcoderx/dynamic-mock-server:new-version \
  -n dynamic-mock-server

# Check rollout status
kubectl rollout status deployment/dynamic-mock-server -n dynamic-mock-server
```

### Rollbacks
```bash
# View rollout history
kubectl rollout history deployment/dynamic-mock-server -n dynamic-mock-server

# Rollback to previous version
kubectl rollout undo deployment/dynamic-mock-server -n dynamic-mock-server
```

## 🧹 Cleanup

```bash
# Remove all resources
npm run k8s:cleanup

# Or manually
./scripts/k8s/cleanup.sh
```

## 🚨 Troubleshooting

### Common Issues

1. **Pod not starting:**
   ```bash
   kubectl describe pod <pod-name> -n dynamic-mock-server
   kubectl logs <pod-name> -n dynamic-mock-server
   ```

2. **Service not accessible:**
   ```bash
   kubectl get svc -n dynamic-mock-server
   kubectl describe svc dynamic-mock-server -n dynamic-mock-server
   ```

3. **Persistent volume issues:**
   ```bash
   kubectl get pvc -n dynamic-mock-server
   kubectl describe pvc dynamic-mock-server-pvc -n dynamic-mock-server
   ```

4. **Resource limits:**
   ```bash
   kubectl top pods -n dynamic-mock-server
   kubectl describe hpa dynamic-mock-server-hpa -n dynamic-mock-server
   ```

### Debug Pod
```bash
kubectl run debug --image=curlimages/curl -it --rm --restart=Never -- sh
# Test internal service connectivity
curl http://dynamic-mock-server.dynamic-mock-server.svc.cluster.local:8080/api/health
```

## 📚 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Istio Documentation](https://istio.io/latest/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Prometheus Monitoring](https://prometheus.io/docs/)
