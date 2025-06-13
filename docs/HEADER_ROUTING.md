# Header-Based Mock Routing

This document explains how the Dynamic Mock Server handles header-based routing for cases where multiple mocks share the same path and HTTP method.

## Overview

The mock server now supports sophisticated routing based on:
1. **HTTP Method** (GET, POST, PUT, DELETE, etc.)
2. **Path** (e.g., `/api/users`)
3. **Headers** (e.g., `x-environment: dev`)

## Routing Priority

When a request comes in, the server follows this matching logic:

1. **Filter by Method + Path**: Find all mocks that match the HTTP method and path
2. **Header-Based Disambiguation**: If multiple mocks match method+path:
   - Look for exact header matches first
   - Fall back to mocks with no header requirements
   - Return 404 if no suitable match found

## Uniqueness Rules

Each mock must have a unique combination of:
- Method + Path + Headers

Examples of **VALID** configurations:
```json
[
  {"method": "GET", "path": "/api/users", "headers": {"x-env": "dev"}},
  {"method": "GET", "path": "/api/users", "headers": {"x-env": "prod"}},
  {"method": "GET", "path": "/api/users", "headers": {}},  // fallback
  {"method": "POST", "path": "/api/users", "headers": {}}  // different method
]
```

Examples of **INVALID** configurations (duplicates):
```json
[
  {"method": "GET", "path": "/api/users", "headers": {"x-env": "dev"}},
  {"method": "GET", "path": "/api/users", "headers": {"x-env": "dev"}}  // DUPLICATE!
]
```

## Example Use Cases

### 1. Environment-Based Routing

```bash
# Development environment
curl -H "x-environment: dev" http://localhost:8080/api/users
# Returns dev data

# Production environment  
curl -H "x-environment: prod" http://localhost:8080/api/users
# Returns prod data

# No header (fallback)
curl http://localhost:8080/api/users
# Returns default response
```

### 2. Client-Type Routing

```bash
# Mobile client
curl -H "x-client-type: mobile" -X POST http://localhost:8080/api/auth/login
# Returns mobile-specific token format

# Web client
curl -H "x-client-type: web" -X POST http://localhost:8080/api/auth/login  
# Returns web-specific token with CSRF
```

### 3. API Versioning

```bash
# Version 1 API
curl -H "x-api-version: v1" http://localhost:8080/api/data
# Returns v1 format

# Version 2 API
curl -H "x-api-version: v2" http://localhost:8080/api/data
# Returns v2 format with enhanced features
```

## API Endpoints

### Register a Mock
```bash
POST /api/mocks
Content-Type: application/json

{
  "name": "User API - Dev Environment",
  "method": "GET", 
  "path": "/api/users",
  "headers": {
    "x-environment": "dev"
  },
  "response": {
    "users": [{"id": 1, "name": "Dev User"}]
  },
  "statusCode": 200
}
```

### Test Mock Matching
```bash
POST /api/mocks/test
Content-Type: application/json

{
  "method": "GET",
  "path": "/api/users", 
  "headers": {
    "x-environment": "dev"
  }
}
```

### Analyze Conflicts
```bash
GET /api/mocks/analyze
```

### List All Mocks
```bash
GET /api/mocks
```

### Delete a Mock
```bash
DELETE /api/mocks/{mock-id}
```

## Error Responses

### 404 - No Mock Found
When no mock matches the request, you'll get a detailed 404 response:

```json
{
  "error": "No mock found for this request",
  "request": {
    "method": "GET",
    "path": "/api/users",
    "headers": {
      "x-environment": "staging"
    }
  },
  "suggestion": "Check if your request headers match the required headers for existing mocks",
  "availableSimilarMocks": [
    {
      "method": "GET", 
      "path": "/api/users",
      "headers": {"x-environment": "dev"}
    },
    {
      "method": "GET",
      "path": "/api/users", 
      "headers": {"x-environment": "prod"}
    }
  ]
}
```

### 409 - Duplicate Mock
When trying to register a duplicate mock:

```json
{
  "error": "A mock with the same method, path, and headers already exists. Each mock must have a unique combination of method + path + headers."
}
```

## Best Practices

1. **Use Meaningful Header Names**: Use custom headers like `x-environment`, `x-client-type`, `x-api-version`
2. **Provide Fallbacks**: Include mocks with no headers for backward compatibility
3. **Document Your Headers**: Clearly document required headers for your APIs
4. **Test Your Routing**: Use the `/api/mocks/test` endpoint to verify routing logic
5. **Monitor Conflicts**: Use `/api/mocks/analyze` to identify potential issues

## Advanced Features

### Header Case Insensitivity
Headers are matched case-insensitively:
- `X-Environment: dev` matches `x-environment: dev`

### Multiple Headers
You can require multiple headers for a single mock:
```json
{
  "headers": {
    "x-environment": "dev",
    "x-client-type": "mobile",
    "x-api-version": "v2"
  }
}
```

### Debugging
Enable detailed logging to see the matching process:
- Successful matches show which headers were used
- Failed matches show available alternatives
- The analyze endpoint helps identify configuration issues
