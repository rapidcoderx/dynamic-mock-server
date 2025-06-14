#!/bin/bash

# Dynamic Mock Server - Kubernetes Cleanup Script
set -e

echo "🧹 Dynamic Mock Server - Kubernetes Cleanup"
echo "==========================================="

NAMESPACE="dynamic-mock-server"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check kubectl
if ! command_exists kubectl; then
    echo "❌ kubectl not found. Please install kubectl first."
    exit 1
fi

# Confirm deletion
echo "⚠️  This will delete ALL resources in the '${NAMESPACE}' namespace."
echo "📋 Resources to be deleted:"
kubectl get all -n ${NAMESPACE} 2>/dev/null || echo "   No resources found or namespace doesn't exist"

echo ""
read -p "Are you sure you want to continue? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "❌ Cleanup cancelled"
    exit 0
fi

echo ""
echo "🗑️ Cleaning up resources..."

# Delete Istio resources
echo "🌊 Removing Istio resources..."
kubectl delete -f k8s/istio-virtualservice.yaml --ignore-not-found=true
kubectl delete -f k8s/istio-gateway.yaml --ignore-not-found=true

# Delete HPA
echo "📊 Removing autoscaling..."
kubectl delete -f k8s/hpa.yaml --ignore-not-found=true

# Delete Deployment
echo "🚀 Removing deployment..."
kubectl delete -f k8s/deployment.yaml --ignore-not-found=true

# Delete Services
echo "🌐 Removing services..."
kubectl delete -f k8s/service.yaml --ignore-not-found=true

# Delete PVC (this will delete persistent data!)
echo "💾 Removing persistent volume..."
read -p "Do you want to delete persistent data? (y/N): " delete_pvc
if [[ $delete_pvc =~ ^[Yy]$ ]]; then
    kubectl delete -f k8s/pvc.yaml --ignore-not-found=true
    echo "⚠️ Persistent data deleted!"
else
    echo "💾 Persistent volume preserved"
fi

# Delete ConfigMap and Secrets
echo "⚙️ Removing configuration..."
kubectl delete -f k8s/configmap.yaml --ignore-not-found=true
kubectl delete -f k8s/secrets.yaml --ignore-not-found=true

# Delete RBAC
echo "🔐 Removing RBAC..."
kubectl delete -f k8s/rbac.yaml --ignore-not-found=true

# Delete namespace
echo "📁 Removing namespace..."
read -p "Do you want to delete the entire namespace? (y/N): " delete_namespace
if [[ $delete_namespace =~ ^[Yy]$ ]]; then
    kubectl delete -f k8s/namespace.yaml --ignore-not-found=true
    echo "📁 Namespace deleted"
else
    echo "📁 Namespace preserved"
fi

echo ""
echo "✅ Cleanup completed!"
echo ""
echo "📋 Verification:"
echo "kubectl get all -n ${NAMESPACE}"
