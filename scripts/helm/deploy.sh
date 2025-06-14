#!/bin/bash

# Helm Deployment Script for Dynamic Mock Server
# Usage: ./deploy.sh [environment] [namespace] [release-name]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HELM_CHART_PATH="$PROJECT_ROOT/helm/dynamic-mock-server"

# Default values
ENVIRONMENT="${1:-development}"
NAMESPACE="${2:-default}"
RELEASE_NAME="${3:-dynamic-mock-server}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if helm is installed
check_helm() {
    if ! command -v helm &> /dev/null; then
        log_error "Helm is not installed. Please install Helm first."
        exit 1
    fi
    log_info "Helm version: $(helm version --short)"
}

# Check if kubectl is configured
check_kubectl() {
    if ! kubectl cluster-info &> /dev/null; then
        log_error "kubectl is not configured or cluster is not accessible."
        exit 1
    fi
    log_info "Connected to cluster: $(kubectl config current-context)"
}

# Create namespace if it doesn't exist
create_namespace() {
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_info "Creating namespace: $NAMESPACE"
        kubectl create namespace "$NAMESPACE"
    else
        log_info "Namespace $NAMESPACE already exists"
    fi
}

# Validate Helm chart
validate_chart() {
    log_info "Validating Helm chart..."
    if ! helm lint "$HELM_CHART_PATH"; then
        log_error "Helm chart validation failed"
        exit 1
    fi
    log_success "Helm chart validation passed"
}

# Deploy or upgrade the release
deploy_chart() {
    local values_file=""
    
    # Determine values file based on environment
    case "$ENVIRONMENT" in
        "development"|"dev")
            values_file="$HELM_CHART_PATH/examples/values-development.yaml"
            ;;
        "production"|"prod")
            values_file="$HELM_CHART_PATH/examples/values-production.yaml"
            ;;
        "istio")
            values_file="$HELM_CHART_PATH/examples/values-istio.yaml"
            ;;
        *)
            log_warning "Unknown environment: $ENVIRONMENT. Using default values."
            ;;
    esac
    
    # Build helm command
    local helm_cmd="helm upgrade --install $RELEASE_NAME $HELM_CHART_PATH --namespace $NAMESPACE --create-namespace"
    
    if [[ -n "$values_file" && -f "$values_file" ]]; then
        helm_cmd="$helm_cmd --values $values_file"
        log_info "Using values file: $values_file"
    fi
    
    # Add wait flag for better deployment tracking
    helm_cmd="$helm_cmd --wait --timeout=300s"
    
    log_info "Deploying/Upgrading release: $RELEASE_NAME"
    log_info "Command: $helm_cmd"
    
    if eval "$helm_cmd"; then
        log_success "Deployment completed successfully"
    else
        log_error "Deployment failed"
        exit 1
    fi
}

# Show deployment status
show_status() {
    log_info "Checking deployment status..."
    
    echo
    log_info "Helm Release Status:"
    helm status "$RELEASE_NAME" --namespace "$NAMESPACE"
    
    echo
    log_info "Pod Status:"
    kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME"
    
    echo
    log_info "Service Status:"
    kubectl get svc -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME"
    
    echo
    log_info "Ingress Status (if enabled):"
    kubectl get ingress -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" 2>/dev/null || echo "No ingress found"
}

# Run tests
run_tests() {
    log_info "Running Helm tests..."
    if helm test "$RELEASE_NAME" --namespace "$NAMESPACE"; then
        log_success "All tests passed"
    else
        log_warning "Some tests failed. Check the test pods for details."
    fi
}

# Show usage information
show_usage() {
    cat << EOF
Usage: $0 [environment] [namespace] [release-name]

Arguments:
  environment   Deployment environment (development, production, istio) [default: development]
  namespace     Kubernetes namespace [default: default]
  release-name  Helm release name [default: dynamic-mock-server]

Examples:
  $0                                    # Deploy to development environment
  $0 production                        # Deploy to production environment
  $0 development my-namespace          # Deploy to custom namespace
  $0 production my-namespace my-app    # Deploy with custom release name

Environments:
  development  - Single replica, in-memory database, relaxed security
  production   - Multiple replicas, PostgreSQL, enhanced security
  istio        - Istio service mesh integration

Prerequisites:
  - Helm 3.2.0+
  - kubectl configured for target cluster
  - Kubernetes 1.19+
EOF
}

# Main execution
main() {
    # Show usage if help is requested
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_usage
        exit 0
    fi
    
    log_info "Starting deployment of Dynamic Mock Server"
    log_info "Environment: $ENVIRONMENT"
    log_info "Namespace: $NAMESPACE"
    log_info "Release Name: $RELEASE_NAME"
    
    # Perform checks
    check_helm
    check_kubectl
    validate_chart
    create_namespace
    
    # Deploy
    deploy_chart
    
    # Show status
    show_status
    
    # Run tests
    echo
    read -p "Do you want to run Helm tests? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        run_tests
    fi
    
    log_success "Deployment process completed!"
    
    # Show access information
    echo
    log_info "Access Information:"
    echo "  - Health Check: kubectl port-forward svc/$RELEASE_NAME 8080:8080 -n $NAMESPACE"
    echo "  - Swagger UI: http://localhost:8080/api-docs"
    echo "  - Metrics: http://localhost:9464/metrics"
    echo "  - Logs: kubectl logs -f deployment/$RELEASE_NAME -n $NAMESPACE"
}

# Execute main function
main "$@"
