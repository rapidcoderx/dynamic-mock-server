# Dynamic Mock Server Helm Chart

This Helm chart deploys the Dynamic Mock Server on a Kubernetes cluster using the Helm package manager.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- PV provisioner support in the underlying infrastructure (if persistence is enabled)

## Installing the Chart

To install the chart with the release name `my-dynamic-mock-server`:

```bash
helm install my-dynamic-mock-server ./helm/dynamic-mock-server
```

The command deploys Dynamic Mock Server on the Kubernetes cluster in the default configuration. The [Parameters](#parameters) section lists the parameters that can be configured during installation.

> **Tip**: List all releases using `helm list`

## Uninstalling the Chart

To uninstall/delete the `my-dynamic-mock-server` deployment:

```bash
helm delete my-dynamic-mock-server
```

The command removes all the Kubernetes components associated with the chart and deletes the release.

## Parameters

### Global parameters

| Name               | Description                                     | Value |
| ------------------ | ----------------------------------------------- | ----- |
| `nameOverride`     | String to partially override dynamic-mock-server.fullname | `""` |
| `fullnameOverride` | String to fully override dynamic-mock-server.fullname     | `""` |

### Dynamic Mock Server Image parameters

| Name                | Description                                        | Value                            |
| ------------------- | -------------------------------------------------- | -------------------------------- |
| `image.repository`  | Dynamic Mock Server image repository              | `rapidcoderx/dynamic-mock-server` |
| `image.tag`         | Dynamic Mock Server image tag (immutable tags are recommended) | `latest` |
| `image.pullPolicy`  | Dynamic Mock Server image pull policy            | `IfNotPresent` |
| `imagePullSecrets`  | Dynamic Mock Server image pull secrets           | `[]` |

### Dynamic Mock Server deployment parameters

| Name                                    | Description                                                                               | Value           |
| --------------------------------------- | ----------------------------------------------------------------------------------------- | --------------- |
| `replicaCount`                         | Number of Dynamic Mock Server replicas to deploy                                         | `2`             |
| `podAnnotations`                       | Annotations for Dynamic Mock Server pods                                                 | `{}`            |
| `podSecurityContext`                   | Set Dynamic Mock Server pod's Security Context                                           | `{}`            |
| `securityContext`                      | Set Dynamic Mock Server container's Security Context                                     | `{}`            |
| `resources.limits`                     | The resources limits for the Dynamic Mock Server containers                              | `{}`            |
| `resources.requests`                   | The requested resources for the Dynamic Mock Server containers                           | `{}`            |
| `nodeSelector`                         | Node labels for Dynamic Mock Server pods assignment                                      | `{}`            |
| `tolerations`                          | Tolerations for Dynamic Mock Server pods assignment                                      | `[]`            |
| `affinity`                             | Affinity for Dynamic Mock Server pods assignment                                         | `{}`            |

### Traffic Exposure Parameters

| Name                               | Description                                                                                                                      | Value                    |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `service.type`                     | Dynamic Mock Server service type                                                                                                | `ClusterIP`              |
| `service.port`                     | Dynamic Mock Server service HTTP port                                                                                           | `8080`                   |
| `service.targetPort`               | Dynamic Mock Server service HTTP target port                                                                                    | `8080`                   |
| `service.metricsPort`              | Dynamic Mock Server service metrics port                                                                                        | `9464`                   |
| `ingress.enabled`                  | Enable ingress record generation for Dynamic Mock Server                                                                        | `false`                  |
| `ingress.className`                | IngressClass that will be be used to implement the Ingress (Kubernetes 1.18+)                                                 | `""`                     |
| `ingress.annotations`              | Additional annotations for the Ingress resource. To enable certificate autogeneration, place here your cert-manager annotations. | `{}`                     |
| `ingress.hosts`                    | An array with hosts and paths                                                                                                   | `[{"host": "dynamic-mock-server.local", "paths": [{"path": "/", "pathType": "Prefix"}]}]` |
| `ingress.tls`                      | TLS configuration for additional hostname(s) to be covered with this ingress record                                            | `[]`                     |

### Persistence Parameters

| Name                        | Description                                                | Value               |
| --------------------------- | ---------------------------------------------------------- | ------------------- |
| `persistence.enabled`       | Enable persistence using Persistent Volume Claims         | `false`             |
| `persistence.accessMode`    | Persistent Volume access mode                              | `ReadWriteOnce`     |
| `persistence.size`          | Persistent Volume size                                     | `1Gi`               |
| `persistence.storageClass`  | Persistent Volume storage class                            | `""`                |

### Autoscaling parameters

| Name                                            | Description                                                                                                                                                            | Value   |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `autoscaling.enabled`                          | Enable Horizontal POD autoscaling for Dynamic Mock Server                                                                                                             | `true`  |
| `autoscaling.minReplicas`                      | Minimum number of Dynamic Mock Server replicas                                                                                                                        | `2`     |
| `autoscaling.maxReplicas`                      | Maximum number of Dynamic Mock Server replicas                                                                                                                        | `10`    |
| `autoscaling.targetCPUUtilizationPercentage`   | Target CPU utilization percentage                                                                                                                                     | `80`    |
| `autoscaling.targetMemoryUtilizationPercentage`| Target Memory utilization percentage                                                                                                                                  | `80`    |

### Database parameters

| Name                                    | Description                                    | Value                        |
| --------------------------------------- | ---------------------------------------------- | ---------------------------- |
| `config.database.type`                 | Database type (memory, mongodb, postgresql)   | `memory`                     |
| `config.database.mongodb.uri`          | MongoDB connection URI                         | `""`                         |
| `config.database.mongodb.database`     | MongoDB database name                          | `dynamic_mock_server`        |
| `config.database.postgresql.host`      | PostgreSQL host                                | `""`                         |
| `config.database.postgresql.port`      | PostgreSQL port                                | `5432`                       |
| `config.database.postgresql.database`  | PostgreSQL database name                       | `dynamic_mock_server`        |
| `config.database.postgresql.username`  | PostgreSQL username                            | `""`                         |
| `config.database.postgresql.password`  | PostgreSQL password                            | `""`                         |
| `config.database.postgresql.ssl`       | PostgreSQL SSL connection                      | `false`                      |

### Monitoring parameters

| Name                                    | Description                                    | Value           |
| --------------------------------------- | ---------------------------------------------- | --------------- |
| `config.opentelemetry.enabled`         | Enable OpenTelemetry                           | `true`          |
| `config.opentelemetry.serviceName`     | OpenTelemetry service name                     | `dynamic-mock-server` |
| `config.opentelemetry.prometheusEnabled`| Enable Prometheus metrics                     | `true`          |
| `serviceMonitor.enabled`                | Create ServiceMonitor resource(s) for scraping metrics using PrometheusOperator | `false` |
| `serviceMonitor.namespace`              | The namespace in which the ServiceMonitor will be created | `""` |
| `serviceMonitor.interval`               | The interval at which metrics should be scraped | `30s` |
| `serviceMonitor.path`                   | The path to scrape metrics from               | `/metrics`      |

### Security parameters

| Name                                    | Description                                    | Value           |
| --------------------------------------- | ---------------------------------------------- | --------------- |
| `config.security.cors.enabled`         | Enable CORS                                    | `true`          |
| `config.security.cors.origin`          | CORS allowed origins                           | `*`             |
| `config.security.helmet.enabled`       | Enable Helmet security middleware             | `true`          |
| `config.security.rateLimit.enabled`    | Enable rate limiting                           | `true`          |
| `config.security.rateLimit.windowMs`   | Rate limit window in milliseconds             | `900000`        |
| `config.security.rateLimit.max`        | Maximum requests per window                    | `100`           |

### Network Policy parameters

| Name                                    | Description                                    | Value           |
| --------------------------------------- | ---------------------------------------------- | --------------- |
| `networkPolicy.enabled`                | Enable creation of NetworkPolicy resources     | `false`         |
| `networkPolicy.ingress.enabled`        | Enable ingress rules                           | `true`          |
| `networkPolicy.ingress.from`           | List of ingress sources                        | `[]`            |
| `networkPolicy.egress.enabled`         | Enable egress rules                            | `true`          |
| `networkPolicy.egress.to`              | List of egress destinations                    | `[]`            |

### Istio parameters

| Name                                    | Description                                    | Value                       |
| --------------------------------------- | ---------------------------------------------- | --------------------------- |
| `istio.enabled`                         | Enable Istio integration                       | `false`                     |
| `istio.gateway.enabled`                 | Create Istio Gateway                           | `false`                     |
| `istio.gateway.hosts`                   | List of hosts for the gateway                  | `["dynamic-mock-server.local"]` |
| `istio.gateway.tls.httpsRedirect`       | Enable HTTPS redirect                          | `true`                      |
| `istio.virtualService.enabled`          | Create Istio VirtualService                    | `false`                     |
| `istio.virtualService.gateways`         | List of gateways for the virtual service       | `["dynamic-mock-server-gateway"]` |

## Configuration and Installation Details

### Database Configuration

The chart supports three database types:

1. **Memory (default)**: Data is stored in memory and lost on restart
2. **MongoDB**: Persistent storage using MongoDB
3. **PostgreSQL**: Persistent storage using PostgreSQL

#### Using MongoDB

```bash
helm install my-dynamic-mock-server ./helm/dynamic-mock-server \
  --set config.database.type=mongodb \
  --set config.database.mongodb.uri="mongodb://mongodb:27017/dynamic_mock_server"
```

#### Using PostgreSQL

```bash
helm install my-dynamic-mock-server ./helm/dynamic-mock-server \
  --set config.database.type=postgresql \
  --set config.database.postgresql.host=postgresql \
  --set config.database.postgresql.username=postgres \
  --set config.database.postgresql.password=secretpassword
```

### Ingress Configuration

To enable ingress:

```bash
helm install my-dynamic-mock-server ./helm/dynamic-mock-server \
  --set ingress.enabled=true \
  --set ingress.hosts[0].host=dynamic-mock-server.example.com \
  --set ingress.hosts[0].paths[0].path=/ \
  --set ingress.hosts[0].paths[0].pathType=Prefix
```

### Monitoring and Observability

#### Prometheus Metrics

Metrics are automatically exposed on port 9464. To enable ServiceMonitor for Prometheus Operator:

```bash
helm install my-dynamic-mock-server ./helm/dynamic-mock-server \
  --set serviceMonitor.enabled=true
```

### Istio Service Mesh

To deploy with Istio:

```bash
helm install my-dynamic-mock-server ./helm/dynamic-mock-server \
  --set istio.enabled=true \
  --set istio.gateway.enabled=true \
  --set istio.virtualService.enabled=true \
  --set istio.gateway.hosts[0]=dynamic-mock-server.example.com
```

### Autoscaling

Horizontal Pod Autoscaling is enabled by default. To disable:

```bash
helm install my-dynamic-mock-server ./helm/dynamic-mock-server \
  --set autoscaling.enabled=false \
  --set replicaCount=3
```

### Network Policies

To enable network policies for enhanced security:

```bash
helm install my-dynamic-mock-server ./helm/dynamic-mock-server \
  --set networkPolicy.enabled=true
```

## Testing

To run the included tests:

```bash
helm test my-dynamic-mock-server
```

## Upgrading

To upgrade the deployment:

```bash
helm upgrade my-dynamic-mock-server ./helm/dynamic-mock-server
```

## Values Files

You can also provide the configuration via values files:

```bash
helm install my-dynamic-mock-server ./helm/dynamic-mock-server -f values-production.yaml
```

Example `values-production.yaml`:

```yaml
replicaCount: 3
image:
  tag: "1.0.0"
config:
  database:
    type: postgresql
    postgresql:
      host: postgresql-ha
      username: postgres
      password: secretpassword
ingress:
  enabled: true
  hosts:
    - host: api.example.com
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
serviceMonitor:
  enabled: true
networkPolicy:
  enabled: true
```
