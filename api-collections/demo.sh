#!/bin/bash

# Demo script for Dynamic Mock Server API Collections
# This script demonstrates the complete workflow using HTTPie commands

set -e  # Exit on any error

BASE_URL="http://localhost:3000"
API_PREFIX="/api/v1"

echo "🚀 Dynamic Mock Server API Demo"
echo "=============================="
echo ""

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}📝 Step $1: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if HTTPie is installed
if ! command -v http &> /dev/null; then
    print_error "HTTPie is not installed. Please install it first:"
    echo "  pip install httpie"
    echo "  # or"
    echo "  brew install httpie"
    exit 1
fi

# Check if server is running
print_step "1" "Checking if server is running..."
if ! curl -s "${BASE_URL}${API_PREFIX}/health" > /dev/null; then
    print_error "Mock server is not running on ${BASE_URL}"
    echo "Please start the server first:"
    echo "  npm start"
    exit 1
fi

print_success "Server is running!"
echo ""

# Health check
print_step "2" "Getting server health status..."
http GET "${BASE_URL}${API_PREFIX}/health"
echo ""

# List existing mocks
print_step "3" "Listing existing mocks..."
EXISTING_MOCKS=$(http --print=b GET "${BASE_URL}${API_PREFIX}/mocks")
echo "$EXISTING_MOCKS" | jq .
MOCK_COUNT=$(echo "$EXISTING_MOCKS" | jq 'length')
print_success "Found $MOCK_COUNT existing mocks"
echo ""

# Create a static mock
print_step "4" "Creating a static mock..."
CREATE_RESPONSE=$(http --print=b POST "${BASE_URL}${API_PREFIX}/mocks" \
  name="Demo User API" \
  method="GET" \
  path="/demo/user" \
  response:='{
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Engineering"
  }' \
  statusCode:=200 \
  dynamic:=false)

STATIC_MOCK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')
print_success "Created static mock with ID: $STATIC_MOCK_ID"
echo ""

# Create a dynamic mock
print_step "5" "Creating a dynamic mock..."
DYNAMIC_CREATE_RESPONSE=$(http --print=b POST "${BASE_URL}${API_PREFIX}/mocks" \
  name="Demo Dynamic Products" \
  method="GET" \
  path="/demo/products" \
  response:='{
    "products": [{
      "id": "{{uuid}}",
      "name": "{{commerce.productName}}",
      "price": "{{commerce.price}}",
      "category": "{{commerce.department}}",
      "inStock": "{{datatype.boolean}}"
    }],
    "timestamp": "{{date.now}}",
    "requestId": "{{uuid}}"
  }' \
  statusCode:=200 \
  delay:=500 \
  dynamic:=true)

DYNAMIC_MOCK_ID=$(echo "$DYNAMIC_CREATE_RESPONSE" | jq -r '.id')
print_success "Created dynamic mock with ID: $DYNAMIC_MOCK_ID"
echo ""

# Test the static mock
print_step "6" "Testing the static mock..."
echo "Calling: GET ${BASE_URL}/demo/user"
http GET "${BASE_URL}/demo/user"
echo ""

# Test the dynamic mock multiple times
print_step "7" "Testing the dynamic mock (3 calls to show different responses)..."
for i in {1..3}; do
    echo "Call $i: GET ${BASE_URL}/demo/products"
    http GET "${BASE_URL}/demo/products" | jq .
    echo ""
done

# Update the static mock
print_step "8" "Updating the static mock..."
http PUT "${BASE_URL}${API_PREFIX}/mocks/${STATIC_MOCK_ID}" \
  name="Demo User API (Updated)" \
  method="GET" \
  path="/demo/user" \
  response:='{
    "id": 1,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "department": "Engineering",
    "role": "Senior Developer",
    "lastLogin": "2024-01-15T10:30:00Z"
  }' \
  statusCode:=200 \
  dynamic:=false
print_success "Updated static mock"
echo ""

# Test the updated mock
print_step "9" "Testing the updated static mock..."
echo "Calling updated: GET ${BASE_URL}/demo/user"
http GET "${BASE_URL}/demo/user"
echo ""

# Preview dynamic response
print_step "10" "Previewing a dynamic response template..."
http POST "${BASE_URL}${API_PREFIX}/mocks/preview" \
  response:='{
    "user": {
      "id": "{{uuid}}",
      "name": "{{person.fullName}}",
      "email": "{{internet.email}}",
      "joinDate": "{{date.past}}"
    },
    "generated": "{{date.now}}"
  }'
echo ""

# Get available placeholders
print_step "11" "Getting available dynamic placeholders..."
PLACEHOLDERS=$(http --print=b GET "${BASE_URL}${API_PREFIX}/mocks/placeholders")
echo "$PLACEHOLDERS" | jq '.categories | keys'
print_success "Available placeholder categories shown above"
echo ""

# Export all mocks
print_step "12" "Exporting all mocks..."
EXPORT_DATA=$(http --print=b GET "${BASE_URL}${API_PREFIX}/mocks/export")
echo "$EXPORT_DATA" | jq '. | length' | xargs -I {} echo "Exported {} mocks"
echo ""

# Analyze a request
print_step "13" "Analyzing request matching..."
http GET "${BASE_URL}${API_PREFIX}/mocks/analyze" method==GET path==/demo/user
echo ""

# Test mock endpoint
print_step "14" "Testing mock endpoint matching..."
http POST "${BASE_URL}${API_PREFIX}/mocks/test" \
  method="GET" \
  path="/demo/user" \
  headers:='{}'
echo ""

# Clean up - delete the created mocks
print_step "15" "Cleaning up - deleting created mocks..."
http DELETE "${BASE_URL}${API_PREFIX}/mocks/${STATIC_MOCK_ID}"
print_success "Deleted static mock"

http DELETE "${BASE_URL}${API_PREFIX}/mocks/${DYNAMIC_MOCK_ID}"
print_success "Deleted dynamic mock"
echo ""

# Final mock count
print_step "16" "Final verification..."
FINAL_MOCKS=$(http --print=b GET "${BASE_URL}${API_PREFIX}/mocks")
FINAL_COUNT=$(echo "$FINAL_MOCKS" | jq 'length')
print_success "Demo completed! Final mock count: $FINAL_COUNT"

echo ""
echo "🎉 Demo completed successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 What you've seen:"
echo "  • Health checks and server status"
echo "  • Creating static and dynamic mocks"
echo "  • Calling mock endpoints directly"
echo "  • Updating existing mocks"
echo "  • Previewing dynamic responses"
echo "  • Analyzing request matching"
echo "  • Exporting and testing mocks"
echo "  • Cleaning up resources"
echo ""
echo "🔗 Next steps:"
echo "  • Import the Postman collection: api-collections/Dynamic-Mock-Server.postman_collection.json"
echo "  • Explore HTTPie commands: api-collections/httpie-commands.sh"
echo "  • Read the documentation: api-collections/README.md"
echo "  • Try the web UI: ${BASE_URL}/"
