# Dynamic Mock Server - HTTPie Commands Collection
# =================================================
# Complete collection of HTTPie commands for the Dynamic Mock Server API
# 
# Prerequisites:
# - HTTPie installed (https://httpie.io/)
# - Mock server running on http://localhost:3000
# - jq installed for JSON processing (optional, for better output formatting)
#
# Usage: Copy and paste the commands below, or run this file as a shell script
# Base URL: http://localhost:3000/api/v1

# Set base URL and API prefix for convenience
BASE_URL="http://localhost:3000"
API_PREFIX="/api/v1"

echo "🚀 Dynamic Mock Server - HTTPie Commands Collection"
echo "=================================================="
echo ""

# ======================
# Health & Configuration
# ======================

echo "📊 Health & Configuration Commands:"
echo "-----------------------------------"

# Health check
echo "# Health Check"
echo "http GET ${BASE_URL}${API_PREFIX}/health"
echo ""

# Get configuration
echo "# Get Server Configuration"
echo "http GET ${BASE_URL}${API_PREFIX}/config"
echo ""

# ======================
# Mock Management (CRUD)
# ======================

echo "🎭 Mock Management Commands:"
echo "---------------------------"

# List all mocks
echo "# List All Mocks"
echo "http GET ${BASE_URL}${API_PREFIX}/mocks"
echo ""

# Create a static mock
echo "# Create Static Mock"
cat << 'EOF'
http POST ${BASE_URL}${API_PREFIX}/mocks \
  name="User Profile API" \
  method="GET" \
  path="/api/users/profile" \
  headers:='{"Authorization": "Bearer token"}' \
  response:='{
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Engineering",
    "role": "Senior Developer"
  }' \
  statusCode:=200 \
  delay:=null \
  dynamic:=false
EOF
echo ""

# Create a dynamic mock
echo "# Create Dynamic Mock"
cat << 'EOF'
http POST ${BASE_URL}${API_PREFIX}/mocks \
  name="Dynamic Product List" \
  method="GET" \
  path="/api/products" \
  response:='{
    "products": [{
      "id": "{{uuid}}",
      "name": "{{commerce.productName}}",
      "price": "{{commerce.price}}",
      "description": "{{lorem.sentences}}",
      "category": "{{commerce.department}}",
      "inStock": "{{datatype.boolean}}",
      "createdAt": "{{date.recent}}"
    }],
    "total": "{{datatype.number}}",
    "page": 1,
    "timestamp": "{{date.now}}"
  }' \
  statusCode:=200 \
  delay:=500 \
  dynamic:=true
EOF
echo ""

# Create a mock with header matching
echo "# Create Mock with Header Matching"
cat << 'EOF'
http POST ${BASE_URL}${API_PREFIX}/mocks \
  name="Admin API" \
  method="GET" \
  path="/api/admin/users" \
  headers:='{"Authorization": "Bearer admin-token", "X-Admin-Role": "super"}' \
  response:='{
    "users": [
      {"id": 1, "name": "Admin User", "role": "admin"},
      {"id": 2, "name": "Regular User", "role": "user"}
    ],
    "adminAccess": true
  }' \
  statusCode:=200 \
  dynamic:=false
EOF
echo ""

# Update a mock (replace MOCK_ID with actual ID)
echo "# Update Mock (replace MOCK_ID with actual mock ID)"
cat << 'EOF'
http PUT ${BASE_URL}${API_PREFIX}/mocks/MOCK_ID \
  name="Updated User Profile API" \
  method="GET" \
  path="/api/users/profile" \
  headers:='{"Authorization": "Bearer token"}' \
  response:='{
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "department": "Engineering",
    "role": "Tech Lead",
    "lastLogin": "2024-01-15T10:30:00Z"
  }' \
  statusCode:=200 \
  delay:=100 \
  dynamic:=false
EOF
echo ""

# Delete a mock (replace MOCK_ID with actual ID)
echo "# Delete Mock (replace MOCK_ID with actual mock ID)"
echo "http DELETE ${BASE_URL}${API_PREFIX}/mocks/MOCK_ID"
echo ""

# ======================
# Mock Testing & Analysis
# ======================

echo "🔍 Mock Testing & Analysis Commands:"
echo "-----------------------------------"

# Test mock endpoint
echo "# Test Mock Endpoint"
cat << 'EOF'
http POST ${BASE_URL}${API_PREFIX}/mocks/test \
  method="GET" \
  path="/api/users/profile" \
  headers:='{"Authorization": "Bearer token"}'
EOF
echo ""

# Analyze request
echo "# Analyze Request"
echo "http GET ${BASE_URL}${API_PREFIX}/mocks/analyze method==GET path==/api/users/profile"
echo ""

# Preview dynamic response
echo "# Preview Dynamic Response"
cat << 'EOF'
http POST ${BASE_URL}${API_PREFIX}/mocks/preview \
  response:='{
    "user": {
      "id": "{{uuid}}",
      "name": "{{person.fullName}}",
      "email": "{{internet.email}}",
      "avatar": "{{internet.avatar}}",
      "joinDate": "{{date.past}}"
    },
    "stats": {
      "loginCount": "{{datatype.number}}",
      "lastActive": "{{date.recent}}"
    }
  }'
EOF
echo ""

# Get available placeholders
echo "# Get Available Placeholders"
echo "http GET ${BASE_URL}${API_PREFIX}/mocks/placeholders"
echo ""

# ======================
# Import & Export
# ======================

echo "📦 Import & Export Commands:"
echo "---------------------------"

# Export all mocks
echo "# Export All Mocks"
echo "http GET ${BASE_URL}${API_PREFIX}/mocks/export"
echo ""

# Export to file
echo "# Export All Mocks to File"
echo "http GET ${BASE_URL}${API_PREFIX}/mocks/export > mocks-backup.json"
echo ""

# Import mocks
echo "# Import Mocks"
cat << 'EOF'
http POST ${BASE_URL}${API_PREFIX}/mocks/import \
  mocks:='[
    {
      "name": "Imported Mock 1",
      "method": "GET",
      "path": "/api/imported/endpoint1",
      "response": {
        "message": "This is an imported mock",
        "data": "Sample data"
      },
      "statusCode": 200,
      "dynamic": false
    },
    {
      "name": "Imported Mock 2",
      "method": "POST",
      "path": "/api/imported/endpoint2",
      "response": {
        "id": "{{uuid}}",
        "timestamp": "{{date.now}}",
        "success": true
      },
      "statusCode": 201,
      "dynamic": true
    }
  ]' \
  overwrite:=false
EOF
echo ""

# Import from file
echo "# Import Mocks from File"
echo "http POST ${BASE_URL}${API_PREFIX}/mocks/import < mocks-backup.json"
echo ""

# Export Postman collection
echo "# Export Postman Collection"
echo "http GET ${BASE_URL}${API_PREFIX}/mocks/export/postman > postman-collection.json"
echo ""

# Export HTTPie collection
echo "# Export HTTPie Collection"
echo "http GET ${BASE_URL}${API_PREFIX}/mocks/export/httpie > httpie-commands.sh"
echo ""

# ======================
# Mock Invocation Examples
# ======================

echo "🎯 Mock Invocation Examples:"
echo "---------------------------"
echo "# These commands call the actual mock endpoints (not the management API)"

# Call user profile mock
echo "# Call User Profile Mock"
echo "http GET ${BASE_URL}/api/users/profile Authorization:'Bearer token'"
echo ""

# Call dynamic product list mock
echo "# Call Dynamic Product List Mock"
echo "http GET ${BASE_URL}/api/products"
echo ""

# Call mock with POST data
echo "# Call Mock with POST Data"
cat << 'EOF'
http POST ${BASE_URL}/api/products \
  name="New Product" \
  price:=99.99 \
  category="Electronics"
EOF
echo ""

# Call admin API with headers
echo "# Call Admin API with Required Headers"
echo "http GET ${BASE_URL}/api/admin/users Authorization:'Bearer admin-token' X-Admin-Role:super"
echo ""

# ======================
# Advanced Examples
# ======================

echo "🚀 Advanced Examples:"
echo "--------------------"

# Create a mock with delay and custom status code
echo "# Create Mock with Delay and Custom Status Code"
cat << 'EOF'
http POST ${BASE_URL}${API_PREFIX}/mocks \
  name="Slow API Response" \
  method="GET" \
  path="/api/slow" \
  response:='{"message": "This response was delayed", "timestamp": "{{date.now}}"}' \
  statusCode:=202 \
  delay:=2000 \
  dynamic:=true
EOF
echo ""

# Create a mock that returns an error
echo "# Create Mock that Returns an Error"
cat << 'EOF'
http POST ${BASE_URL}${API_PREFIX}/mocks \
  name="Error Response Mock" \
  method="POST" \
  path="/api/error" \
  response:='{"error": "Something went wrong", "code": "INTERNAL_ERROR", "timestamp": "{{date.now}}"}' \
  statusCode:=500 \
  dynamic:=true
EOF
echo ""

# Create a mock with complex dynamic data
echo "# Create Mock with Complex Dynamic Data"
cat << 'EOF'
http POST ${BASE_URL}${API_PREFIX}/mocks \
  name="Complex User Data" \
  method="GET" \
  path="/api/users/{{datatype.number}}" \
  response:='{
    "user": {
      "id": "{{datatype.number}}",
      "profile": {
        "firstName": "{{person.firstName}}",
        "lastName": "{{person.lastName}}",
        "fullName": "{{person.fullName}}",
        "email": "{{internet.email}}",
        "phone": "{{phone.number}}",
        "avatar": "{{internet.avatar}}"
      },
      "address": {
        "street": "{{location.streetAddress}}",
        "city": "{{location.city}}",
        "state": "{{location.state}}",
        "zipCode": "{{location.zipCode}}",
        "country": "{{location.country}}"
      },
      "company": {
        "name": "{{company.name}}",
        "department": "{{commerce.department}}",
        "jobTitle": "{{person.jobTitle}}"
      },
      "stats": {
        "joinDate": "{{date.past}}",
        "lastLogin": "{{date.recent}}",
        "loginCount": "{{datatype.number}}",
        "isActive": "{{datatype.boolean}}"
      }
    },
    "metadata": {
      "requestId": "{{uuid}}",
      "timestamp": "{{date.now}}",
      "version": "1.0.0"
    }
  }' \
  statusCode:=200 \
  delay:=100 \
  dynamic:=true
EOF
echo ""

# ======================
# Useful One-liners
# ======================

echo "💡 Useful One-liners:"
echo "--------------------"

echo "# Get all mock names and paths:"
echo "http GET ${BASE_URL}${API_PREFIX}/mocks | jq '.[] | {name: .name, method: .method, path: .path}'"
echo ""

echo "# Count total mocks:"
echo "http GET ${BASE_URL}${API_PREFIX}/mocks | jq 'length'"
echo ""

echo "# Find dynamic mocks:"
echo "http GET ${BASE_URL}${API_PREFIX}/mocks | jq '.[] | select(.dynamic == true)'"
echo ""

echo "# Get mocks with delays:"
echo "http GET ${BASE_URL}${API_PREFIX}/mocks | jq '.[] | select(.delay != null)'"
echo ""

echo "# Check server health and format output:"
echo "http GET ${BASE_URL}${API_PREFIX}/health | jq ."
echo ""

echo "==============================================
📝 Notes:
- Replace MOCK_ID placeholders with actual mock IDs from create responses
- All commands assume the server is running on http://localhost:3000
- Use 'jq' for better JSON formatting and filtering
- Commands can be run individually or as part of automation scripts
- Check response headers for additional metadata (X-Mock-* headers)
=============================================="
