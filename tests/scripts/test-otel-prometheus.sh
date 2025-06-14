#!/bin/bash

# OpenTelemetry and Prometheus Metrics Test Runner
# This script starts the server and runs comprehensive tests

set -e

# Configuration
SERVER_PORT=${PORT:-8080}
PROMETHEUS_PORT=${PROMETHEUS_PORT:-9464}
TEST_TIMEOUT=60

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}🧪 OpenTelemetry and Prometheus Metrics Test Suite${NC}"
echo -e "${CYAN}====================================================${NC}"
echo ""

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    if [ ! -z "$SERVER_PID" ]; then
        echo -e "${CYAN}Stopping server (PID: $SERVER_PID)...${NC}"
        kill $SERVER_PID 2>/dev/null || true
        wait $SERVER_PID 2>/dev/null || true
    fi
    exit $1
}

# Trap to ensure cleanup on exit
trap 'cleanup $?' EXIT INT TERM

echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

echo -e "${BLUE}🚀 Starting Dynamic Mock Server...${NC}"

# Start the server in background
npm start &
SERVER_PID=$!

echo -e "${CYAN}Server PID: $SERVER_PID${NC}"
echo -e "${CYAN}Waiting for server to start...${NC}"

# Wait for server to be ready
for i in {1..30}; do
    if curl -s http://localhost:$SERVER_PORT/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is ready!${NC}"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Server failed to start within 30 seconds${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}⏳ Waiting... (attempt $i/30)${NC}"
    sleep 1
done

echo ""
echo -e "${BLUE}🔍 Running OpenTelemetry and Prometheus tests...${NC}"
echo ""

# Run the test script
if npm run test-otel; then
    echo ""
    echo -e "${GREEN}${BOLD}🎉 All tests passed!${NC}"
    echo -e "${GREEN}OpenTelemetry and Prometheus metrics are working correctly.${NC}"
    echo ""
    echo -e "${CYAN}📊 You can access the following endpoints:${NC}"
    echo -e "${CYAN}• Health: http://localhost:$SERVER_PORT/api/health${NC}"
    echo -e "${CYAN}• Metrics Info: http://localhost:$SERVER_PORT/api/metrics${NC}"
    echo -e "${CYAN}• Prometheus Metrics: http://localhost:$SERVER_PORT/api/metrics/prometheus${NC}"
    echo -e "${CYAN}• Metrics Health: http://localhost:$SERVER_PORT/api/metrics/health${NC}"
    echo -e "${CYAN}• Metrics Summary: http://localhost:$SERVER_PORT/api/metrics/summary${NC}"
    if curl -s http://localhost:$PROMETHEUS_PORT/metrics > /dev/null 2>&1; then
        echo -e "${CYAN}• Standalone Prometheus: http://localhost:$PROMETHEUS_PORT/metrics${NC}"
    fi
    echo ""
    echo -e "${YELLOW}💡 To keep the server running for manual testing, use: npm start${NC}"
    
    cleanup 0
else
    echo ""
    echo -e "${RED}${BOLD}💥 Some tests failed!${NC}"
    echo -e "${RED}Please check the error messages above.${NC}"
    echo ""
    echo -e "${YELLOW}🐛 For debugging, you can:${NC}"
    echo -e "${YELLOW}1. Check server logs${NC}"
    echo -e "${YELLOW}2. Manually test endpoints:${NC}"
    echo -e "${YELLOW}   curl http://localhost:$SERVER_PORT/api/health${NC}"
    echo -e "${YELLOW}   curl http://localhost:$SERVER_PORT/api/metrics${NC}"
    echo -e "${YELLOW}3. Check if OpenTelemetry is properly initialized${NC}"
    
    cleanup 1
fi
