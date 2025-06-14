#!/bin/bash

echo "🧹 Clearing Analytics Data to Start Fresh"
echo "=========================================="

echo "This will clear all existing analytics data so we can start tracking only mock calls."
echo ""

# Clear analytics data
echo "📡 Clearing analytics data..."
response=$(curl -s -X DELETE "http://localhost:8080/api/analytics")
echo "Response: $response"

echo ""
echo "✅ Analytics data cleared!"
echo ""
echo "Now the analytics dashboard will only track:"
echo "  ✓ Mock API calls (/api/mocks/*, actual mock endpoints)"
echo "  ✗ Analytics API calls (/api/analytics/*)"
echo "  ✗ Configuration calls (/api/config)"
echo "  ✗ Static files (favicon, CSS, etc.)"
echo "  ✗ Root page requests (/)"
echo ""
echo "You can now use the mock server and the analytics will only show relevant data!"
