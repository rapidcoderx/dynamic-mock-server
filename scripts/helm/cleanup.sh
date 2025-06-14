#!/bin/bash

# Helm Cleanup Script for Dynamic Mock Server
# Usage: ./cleanup.sh [namespace] [release-name]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Default values
NAMESPACE="${1:-default}"
RELEASE_NAME="${2:-dynamic-mock-server}"

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
}

# Check if kubectl is configured
check_kubectl() {
    if ! kubectl cluster-info &> /dev/null; then
        log_error "kubectl is not configured or cluster is not accessible."
        exit 1
    fi
    log_info "Connected to cluster: $(kubectl config current-context)"
}

# Show current status
show_current_status() {
    log_info "Current deployment status:"
    
    if helm status "$RELEASE_NAME" --namespace "$NAMESPACE" &> /dev/null; then
        helm status "$RELEASE_NAME" --namespace "$NAMESPACE"
        echo
        kubectl get all -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME"
    else
        log_warning "Release $RELEASE_NAME not found in namespace $NAMESPACE"
    fi
}

# Cleanup persistent volumes
cleanup_pvcs() {
    log_info "Checking for persistent volume claims..."
    
    local pvcs=$(kubectl get pvc -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "$pvcs" ]]; then
        log_warning "Found persistent volume claims: $pvcs"
        echo
        read -p "Do you want to delete persistent volume claims? This will DELETE ALL DATA! (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for pvc in $pvcs; do
                log_info "Deleting PVC: $pvc"
                kubectl delete pvc "$pvc" -n "$NAMESPACE"
            done
            log_success "Persistent volume claims deleted"
        else
            log_info "Keeping persistent volume claims"
        fi
    else
        log_info "No persistent volume claims found"
    fi
}

# Cleanup secrets
cleanup_secrets() {
    log_info "Checking for secrets..."
    
    local secrets=$(kubectl get secrets -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "$secrets" ]]; then
        log_info "Found secrets: $secrets"
        read -p "Do you want to delete secrets? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            for secret in $secrets; do
                log_info "Deleting secret: $secret"
                kubectl delete secret "$secret" -n "$NAMESPACE"
            done
            log_success "Secrets deleted"
        else
            log_info "Keeping secrets"
        fi
    else
        log_info "No secrets found"
    fi
}

# Cleanup configmaps
cleanup_configmaps() {
    log_info "Checking for configmaps..."
    
    local configmaps=$(kubectl get configmaps -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")
    
    if [[ -n "$configmaps" ]]; then
        log_info "Found configmaps: $configmaps"
        for configmap in $configmaps; do
            log_info "Deleting configmap: $configmap"
            kubectl delete configmap "$configmap" -n "$NAMESPACE"
        done
        log_success "ConfigMaps deleted"
    else
        log_info "No configmaps found"
    fi
}

# Main cleanup function
cleanup_release() {
    log_info "Uninstalling Helm release: $RELEASE_NAME"
    
    if helm status "$RELEASE_NAME" --namespace "$NAMESPACE" &> /dev/null; then
        if helm uninstall "$RELEASE_NAME" --namespace "$NAMESPACE"; then
            log_success "Helm release uninstalled successfully"
        else
            log_error "Failed to uninstall Helm release"
            exit 1
        fi
    else
        log_warning "Release $RELEASE_NAME not found in namespace $NAMESPACE"
    fi
}

# Check for remaining resources
check_remaining_resources() {
    log_info "Checking for remaining resources..."
    
    local remaining=$(kubectl get all -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" 2>/dev/null || echo "")
    
    if [[ -n "$remaining" ]]; then
        log_warning "Found remaining resources:"
        kubectl get all -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME"
        echo
        read -p "Do you want to force delete remaining resources? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kubectl delete all -n "$NAMESPACE" -l "app.kubernetes.io/instance=$RELEASE_NAME" --force --grace-period=0
            log_success "Remaining resources force deleted"
        fi
    else
        log_success "No remaining resources found"
    fi
}

# Cleanup namespace if empty
cleanup_namespace() {
    if [[ "$NAMESPACE" != "default" && "$NAMESPACE" != "kube-system" && "$NAMESPACE" != "kube-public" ]]; then
        log_info "Checking if namespace $NAMESPACE is empty..."
        
        local resources=$(kubectl get all -n "$NAMESPACE" 2>/dev/null | grep -v "No resources found" || echo "")
        
        if [[ -z "$resources" ]]; then
            echo
            read -p "Namespace $NAMESPACE appears to be empty. Do you want to delete it? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                kubectl delete namespace "$NAMESPACE"
                log_success "Namespace $NAMESPACE deleted"
            fi
        else
            log_info "Namespace $NAMESPACE contains other resources, keeping it"
        fi
    else
        log_info "Not deleting system namespace: $NAMESPACE"
    fi
}

# Show usage information
show_usage() {
    cat << EOF
Usage: $0 [namespace] [release-name]

Arguments:
  namespace     Kubernetes namespace [default: default]
  release-name  Helm release name [default: dynamic-mock-server]

Examples:
  $0                                # Cleanup from default namespace
  $0 my-namespace                   # Cleanup from custom namespace
  $0 my-namespace my-app           # Cleanup custom release

This script will:
  1. Uninstall the Helm release
  2. Optionally cleanup persistent volume claims (DATA LOSS!)
  3. Cleanup secrets and configmaps
  4. Check for and cleanup remaining resources
  5. Optionally cleanup empty namespace

WARNING: This operation cannot be undone!
EOF
}

# Main execution
main() {
    # Show usage if help is requested
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        show_usage
        exit 0
    fi
    
    log_info "Starting cleanup of Dynamic Mock Server"
    log_info "Namespace: $NAMESPACE"
    log_info "Release Name: $RELEASE_NAME"
    
    # Warning prompt
    echo
    log_warning "This will completely remove the Dynamic Mock Server deployment!"
    echo
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleanup cancelled"
        exit 0
    fi
    
    # Perform checks
    check_helm
    check_kubectl
    
    # Show current status
    show_current_status
    echo
    
    # Cleanup steps
    cleanup_release
    cleanup_pvcs
    cleanup_secrets
    cleanup_configmaps
    check_remaining_resources
    cleanup_namespace
    
    log_success "Cleanup completed!"
}

# Execute main function
main "$@"
