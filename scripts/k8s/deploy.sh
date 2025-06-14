#!/bin/bash

# Dynamic Mock Server - Kubernetes Deployment Script
set -e

echo "🚀 Dynamic Mock Server - Kubernetes Deployment"
echo "=============================================="

# Configuration
NAMESPACE="dynamic-mock-server"
APP_NAME="dynamic-mock-server"
IMAGE_TAG="1.0.0-mvp"
DOCKER_REGISTRY="rapidcoderx"  # Change to your registry

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists kubectl; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

if ! command_exists docker; then
    echo "❌ Docker not found. Please install Docker first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Check Kubernetes connection
echo "🔗 Checking Kubernetes connection..."
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi
echo "✅ Connected to Kubernetes cluster"

# Build and push Docker image
echo ""
echo "🐳 Building Docker image..."
docker build -t ${DOCKER_REGISTRY}/${APP_NAME}:${IMAGE_TAG} .
docker build -t ${DOCKER_REGISTRY}/${APP_NAME}:latest .

echo "📤 Pushing Docker image to registry..."
read -p "Do you want to push to Docker registry? (y/N): " push_image
if [[ $push_image =~ ^[Yy]$ ]]; then
    docker push ${DOCKER_REGISTRY}/${APP_NAME}:${IMAGE_TAG}
    docker push ${DOCKER_REGISTRY}/${APP_NAME}:latest
    echo "✅ Image pushed to registry"
else
    echo "⏭️ Skipping image push"
fi

# Apply Kubernetes manifests
echo ""
echo "⚙️ Deploying to Kubernetes..."

# Create namespace
echo "📁 Creating namespace..."
kubectl apply -f k8s/namespace.yaml

# Apply RBAC
echo "🔐 Applying RBAC..."
kubectl apply -f k8s/rbac.yaml

# Apply ConfigMap and Secrets
echo "⚙️ Applying configuration..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Apply PVC
echo "💾 Creating persistent volume..."
kubectl apply -f k8s/pvc.yaml

# Apply Services
echo "🌐 Creating services..."
kubectl apply -f k8s/service.yaml

# Apply Deployment
echo "🚀 Deploying application..."
kubectl apply -f k8s/deployment.yaml

# Apply HPA
echo "📊 Setting up autoscaling..."
kubectl apply -f k8s/hpa.yaml

# Apply Istio resources (if Istio is available)
echo ""
read -p "Do you want to deploy Istio Gateway and VirtualService? (y/N): " deploy_istio
if [[ $deploy_istio =~ ^[Yy]$ ]]; then
    echo "🌊 Deploying Istio resources..."
    kubectl apply -f k8s/istio-gateway.yaml
    kubectl apply -f k8s/istio-virtualservice.yaml
    echo "✅ Istio resources deployed"
else
    echo "⏭️ Skipping Istio deployment"
fi

# Wait for deployment
echo ""
echo "⏳ Waiting for deployment to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/${APP_NAME} -n ${NAMESPACE}

# Get deployment status
echo ""
echo "📊 Deployment Status:"
kubectl get all -n ${NAMESPACE}

# Get service endpoints
echo ""
echo "🌐 Service Information:"
kubectl get svc -n ${NAMESPACE}

# Port forward instructions
echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Check pod status:"
echo "   kubectl get pods -n ${NAMESPACE}"
echo ""
echo "2. View logs:"
echo "   kubectl logs -f deployment/${APP_NAME} -n ${NAMESPACE}"
echo ""
echo "3. Port forward for local access:"
echo "   kubectl port-forward svc/${APP_NAME} 8080:8080 -n ${NAMESPACE}"
echo "   Then access: http://localhost:8080"
echo ""
echo "4. If using Istio, access via:"
echo "   http://mock-server.local (add to /etc/hosts)"
echo ""
echo "5. Monitor with:"
echo "   kubectl top pods -n ${NAMESPACE}"
echo "   kubectl describe hpa ${APP_NAME}-hpa -n ${NAMESPACE}"
