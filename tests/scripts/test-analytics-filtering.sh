#!/bin/bash

echo "🧪 Testing Analytics Filtering - Only Mock Calls Should Be Tracked"
echo "================================================================="

# Function to make a request and show what was tracked
test_tracking() {
    local endpoint=$1
    local description=$2
    echo "📡 Testing $description"
    echo "Making request to: $endpoint"
    
    # Get current request count
    before=$(curl -s "http://localhost:8080/api/analytics/summary" | grep -o '"totalRequests":[0-9]*' | cut -d':' -f2)
    
    # Make the test request
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "http://localhost:8080$endpoint")
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    
    # Get updated request count
    after=$(curl -s "http://localhost:8080/api/analytics/summary" | grep -o '"totalRequests":[0-9]*' | cut -d':' -f2)
    
    # Calculate difference
    tracked=$((after - before))
    
    echo "Status: $http_code"
    echo "Requests tracked: $tracked"
    
    if [ "$tracked" -eq 0 ]; then
        echo "✅ CORRECTLY FILTERED (not tracked)"
    else
        echo "❌ INCORRECTLY TRACKED ($tracked requests added)"
    fi
    echo ""
}

echo "Starting tracking tests (make sure server is running on port 8080)..."
echo ""

# Test analytics endpoints (should NOT be tracked)
echo "=== Testing Analytics API Calls (should NOT be tracked) ==="
test_tracking "/api/analytics/summary" "Analytics Summary"
test_tracking "/api/analytics/dashboard" "Analytics Dashboard"
test_tracking "/api/analytics/requests" "Request History"
test_tracking "/api/mocks" "Mock Management API"
test_tracking "/api/config" "Config Endpoint"

echo "=== Testing Other System Calls (should NOT be tracked) ==="
test_tracking "/" "Root Page"
test_tracking "/favicon.ico" "Favicon"
test_tracking "/.well-known/appspecific/com.chrome.devtools.json" "Chrome DevTools"

echo "=== Testing Documentation & Swagger UI Paths (should NOT be tracked) ==="
test_tracking "/api/docs" "API Documentation"
test_tracking "/api/docs/swagger-ui-init.js" "Swagger UI Script"
test_tracking "/api/health" "Health Check Endpoint"

echo "=== Testing Mock API Calls (SHOULD be tracked) ==="
# Test mock endpoints (should BE tracked)
test_tracking "/api/mocks" "Mock Management API (should be tracked)"
test_tracking "/api/test-endpoint" "Test Mock Endpoint (should be tracked)"

echo "================================================================="
echo "🏁 Tracking filter tests completed!"
echo ""
echo "Analytics API calls should show '✅ CORRECTLY FILTERED'"
echo "Mock API calls should show '❌ INCORRECTLY TRACKED' (meaning they are being tracked, which is correct)"
