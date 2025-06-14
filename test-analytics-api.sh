#!/bin/bash

echo "🧪 Testing Analytics API Endpoints with Empty Data..."
echo "=================================="

# Function to test an endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    echo "📡 Testing $description"
    echo "GET $endpoint"
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "http://localhost:8080$endpoint")
    
    # Extract HTTP status code
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    
    # Extract response body
    body=$(echo $response | sed -e 's/HTTPSTATUS:.*$//')
    
    echo "Status: $http_code"
    
    if [ $http_code -eq 200 ]; then
        echo "✅ SUCCESS"
        echo "Response preview: $(echo $body | head -c 200)..."
    else
        echo "❌ FAILED"
        echo "Error: $body"
    fi
    echo ""
}

echo "Starting tests (make sure server is running on port 8080)..."
echo ""

# Test analytics endpoints
test_endpoint "/api/analytics/summary" "Analytics Summary"
test_endpoint "/api/analytics/dashboard" "Analytics Dashboard"
test_endpoint "/api/analytics/requests" "Request History"
test_endpoint "/api/analytics/performance" "Performance Metrics"
test_endpoint "/api/analytics/export" "Export Analytics"

echo "=================================="
echo "🏁 Tests completed!"
echo ""
echo "If all tests show SUCCESS, the analytics API is working correctly."
echo "If any tests show FAILED, check the server logs for more details."
