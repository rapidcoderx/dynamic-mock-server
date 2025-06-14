#!/bin/bash

echo "🔍 Testing Analytics Database Storage"
echo "===================================="

# Function to test database storage by making real requests
test_analytics_storage() {
    echo "📡 Making test requests to trigger analytics..."
    
    # Make a few test requests to mock endpoints that should be tracked
    echo "1. Making GET request to /api/test..."
    curl -s "http://localhost:8080/api/test" > /dev/null
    
    echo "2. Making POST request to /api/users..."
    curl -s -X POST "http://localhost:8080/api/users" -H "Content-Type: application/json" -d '{"name":"test"}' > /dev/null
    
    echo "3. Making GET request to /api/products..."
    curl -s "http://localhost:8080/api/products" > /dev/null
    
    echo "✅ Test requests completed"
    echo ""
    
    # Wait a moment for async database operations
    echo "⏳ Waiting 2 seconds for database operations..."
    sleep 2
    echo ""
    
    # Check analytics summary
    echo "📊 Checking analytics summary..."
    response=$(curl -s "http://localhost:8080/api/analytics/summary")
    echo "Response: $response"
    echo ""
    
    # Check request history
    echo "📜 Checking request history..."
    history_response=$(curl -s "http://localhost:8080/api/analytics/requests")
    echo "History: $history_response"
    echo ""
    
    # Parse and check if data exists
    # Try to extract totalRequests using different methods
    if command -v jq >/dev/null 2>&1; then
        total_requests=$(echo "$response" | jq -r '.summary.totalRequests // 0' 2>/dev/null)
    else
        # Fallback to sed/grep
        total_requests=$(echo "$response" | sed -n 's/.*"summary":{"totalRequests":\([0-9]*\).*/\1/p' | head -1)
    fi
    
    # Ensure total_requests is a number
    if [ -z "$total_requests" ]; then
        total_requests=0
    fi
    
    if [ "$total_requests" -gt 0 ] 2>/dev/null; then
        echo "✅ Analytics data found: $total_requests total requests"
        
        # Also check request history count
        if command -v jq >/dev/null 2>&1; then
            history_count=$(echo "$history_response" | jq -r '.pagination.total // 0' 2>/dev/null)
        else
            history_count=$(echo "$history_response" | sed -n 's/.*"total":\([0-9]*\).*/\1/p' | head -1)
        fi
        
        if [ -n "$history_count" ] && [ "$history_count" -gt 0 ] 2>/dev/null; then
            echo "✅ Request history found: $history_count stored requests"
        fi
    else
        echo "❌ No analytics data found - possible database issue"
    fi
}

# Function to check database tables directly (if PostgreSQL is used)
check_database_tables() {
    echo "🗄️ Checking database tables..."
    
    # This would require database credentials - for now just check if analytics API works
    echo "Checking via analytics API instead of direct database access..."
    
    # Test if analytics endpoints respond properly
    analytics_health=$(curl -s -w "HTTPSTATUS:%{http_code}" "http://localhost:8080/api/analytics/summary")
    http_code=$(echo $analytics_health | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    
    if [ $http_code -eq 200 ]; then
        echo "✅ Analytics API is responding (HTTP $http_code)"
    else
        echo "❌ Analytics API error (HTTP $http_code)"
    fi
}

echo "Starting analytics storage test..."
echo "Make sure the server is running on port 8080"
echo ""

test_analytics_storage
check_database_tables

echo ""
echo "===================================="
echo "🏁 Analytics storage test completed!"
echo ""
echo "If you see data in the responses above, analytics is working."
echo "If 'totalRequests' is 0 or you see errors, there may be a database issue."
echo ""
echo "To debug further:"
echo "1. Check server logs for database connection errors"
echo "2. Verify PostgreSQL is running and accessible"
echo "3. Check if analytics tables exist in the database"
echo "4. Verify environment variables for database connection"
