#!/bin/bash

# Test script for Analytics Dashboard implementation

echo "🚀 Starting Dynamic Mock Server with Analytics..."

# Start the server in background
node server/index.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

echo "📊 Testing Analytics Implementation..."

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s http://localhost:8080/api/health | jq .

# Test analytics endpoints
echo "2. Testing analytics summary..."
curl -s http://localhost:8080/api/analytics/summary | jq .

echo "3. Testing analytics dashboard..."
curl -s http://localhost:8080/api/analytics/dashboard | jq .

echo "4. Testing request history..."
curl -s http://localhost:8080/api/analytics/requests | jq .

# Create some mock traffic to generate analytics data
echo "5. Creating sample mock and traffic..."

# Create a test mock
curl -s -X POST http://localhost:8080/api/mocks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test-user-api",
    "method": "GET",
    "path": "/api/user",
    "response": {"id": 1, "name": "Test User"},
    "statusCode": 200
  }' | jq .

# Generate some traffic
for i in {1..5}; do
  curl -s http://localhost:8080/api/user > /dev/null
  echo "Generated request $i"
  sleep 1
done

# Test analytics after traffic
echo "6. Testing analytics after traffic generation..."
curl -s http://localhost:8080/api/analytics/summary | jq .

echo "7. Testing UI accessibility..."
curl -s http://localhost:8080/api/ | grep -q "Analytics Dashboard" && echo "✅ Dashboard UI is accessible" || echo "❌ Dashboard UI not found"

# Clean up
echo "🔄 Cleaning up..."
kill $SERVER_PID

echo "✅ Analytics implementation test completed!"
