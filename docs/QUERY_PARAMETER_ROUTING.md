# Query Parameter-Based Mock Routing

This document explains how the Dynamic Mock Server handles query parameter-based routing and matching for sophisticated API mocking scenarios.

## Overview

The mock server supports advanced routing based on:
1. **HTTP Method** (GET, POST, PUT, DELETE, etc.)
2. **Path** (e.g., `/api/products`)
3. **Headers** (e.g., `x-environment: dev`)
4. **Query Parameters** (e.g., `?category=electronics&sort=price`)

## Query Parameter Matching

Query parameters provide powerful filtering capabilities to create different mock responses based on request parameters. This is particularly useful for:

- API versioning (`?version=2`)
- Content filtering (`?category=electronics`)
- Feature flags (`?debug=true`)
- Search functionality (`?search=john`)
- Pagination (`?page=1&limit=10`)

## Match Types

The server supports seven different match types for query parameters:

### 1. `equals` - Exact Match
Matches when the parameter value exactly equals the expected value.

```json
{
  "key": "status",
  "type": "equals", 
  "value": "active",
  "required": true
}
```

**Matches:**
- `?status=active` ✅
- `?status=ACTIVE` ❌ (case-sensitive)
- `?status=inactive` ❌

### 2. `contains` - Substring Match
Matches when the parameter value contains the expected substring.

```json
{
  "key": "name",
  "type": "contains",
  "value": "john", 
  "required": true
}
```

**Matches:**
- `?name=john` ✅
- `?name=johnny` ✅  
- `?name=johnson` ✅
- `?name=John` ❌ (case-sensitive)
- `?name=mike` ❌

### 3. `starts_with` - Prefix Match
Matches when the parameter value starts with the expected substring.

```json
{
  "key": "code",
  "type": "starts_with",
  "value": "US",
  "required": true  
}
```

**Matches:**
- `?code=US` ✅
- `?code=USA` ✅
- `?code=USD` ✅
- `?code=CANADA` ❌
- `?code=us` ❌ (case-sensitive)

### 4. `ends_with` - Suffix Match
Matches when the parameter value ends with the expected substring.

```json
{
  "key": "filename",
  "type": "ends_with", 
  "value": ".pdf",
  "required": true
}
```

**Matches:**
- `?filename=report.pdf` ✅
- `?filename=data.pdf` ✅
- `?filename=report.txt` ❌
- `?filename=.PDF` ❌ (case-sensitive)

### 5. `regex` - Regular Expression Match
Matches when the parameter value matches a regular expression pattern.

```json
{
  "key": "id",
  "type": "regex",
  "value": "^\\d+$",
  "required": true
}
```

**Matches:**
- `?id=123` ✅
- `?id=456789` ✅
- `?id=abc` ❌
- `?id=123abc` ❌

**Common Regex Patterns:**
- Numeric ID: `^\\d+$`
- UUID: `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`
- Email: `^[^@]+@[^@]+\\.[^@]+$`
- ISO Date: `^\\d{4}-\\d{2}-\\d{2}$`

### 6. `exists` - Parameter Presence
Matches when the parameter is present, regardless of its value.

```json
{
  "key": "debug",
  "type": "exists",
  "required": true
}
```

**Matches:**
- `?debug` ✅
- `?debug=true` ✅
- `?debug=false` ✅
- `?debug=` ✅
- (no debug parameter) ❌

### 7. `not_exists` - Parameter Absence
Matches when the parameter is NOT present in the request.

```json
{
  "key": "auth",
  "type": "not_exists", 
  "required": true
}
```

**Matches:**
- (no auth parameter) ✅
- `?auth=token123` ❌
- `?auth=` ❌

## Required vs Optional Parameters

### Required Parameters
When `required: true`, the mock will ONLY match if the parameter condition is met.

```json
{
  "name": "Electronics Products",
  "method": "GET",
  "path": "/api/products",
  "queryParams": [
    {
      "key": "category",
      "type": "equals",
      "value": "electronics", 
      "required": true
    }
  ]
}
```

**Only matches:**
- `/api/products?category=electronics` ✅
- `/api/products?category=electronics&sort=price` ✅

**Does NOT match:**
- `/api/products` ❌
- `/api/products?category=clothing` ❌

### Optional Parameters
When `required: false`, the mock will match whether the parameter is present or not, but if present, the condition must be met.

```json
{
  "name": "Products with Optional Sort",
  "method": "GET", 
  "path": "/api/products",
  "queryParams": [
    {
      "key": "sort",
      "type": "starts_with",
      "value": "price",
      "required": false
    }
  ]
}
```

**Matches:**
- `/api/products` ✅ (no sort parameter)
- `/api/products?sort=price` ✅
- `/api/products?sort=price_asc` ✅

**Does NOT match:**
- `/api/products?sort=name` ❌ (sort present but doesn't match condition)

## Routing Priority

When multiple mocks match the same method and path, the server uses this priority:

1. **Exact Match**: Mocks with all required query parameters matching
2. **Partial Match**: Mocks with some matching parameters (if all present parameters match their conditions)
3. **Fallback**: Mocks with no query parameter requirements
4. **404**: No suitable match found

### Example Scenario

Given these mocks for `GET /api/products`:

```json
[
  {
    "name": "Electronics Products",
    "queryParams": [
      {"key": "category", "type": "equals", "value": "electronics", "required": true}
    ]
  },
  {
    "name": "Sorted Products", 
    "queryParams": [
      {"key": "sort", "type": "exists", "required": true}
    ]
  },
  {
    "name": "Default Products",
    "queryParams": []
  }
]
```

**Request Routing:**
- `GET /api/products?category=electronics` → "Electronics Products"
- `GET /api/products?sort=price` → "Sorted Products"  
- `GET /api/products?category=electronics&sort=price` → "Electronics Products" (first exact match)
- `GET /api/products` → "Default Products"
- `GET /api/products?category=clothing` → "Default Products" (fallback)

## Creating Query Parameter Mocks

### Via Web UI

1. **Open Mock Form**: Click "➕ Add Mock"
2. **Basic Details**: Fill in name, method, and path
3. **Add Parameters**: In "Query Parameters" section, click "➕ Add Parameter"
4. **Configure Each Parameter**:
   - **Parameter name**: The query parameter key (e.g., "category")
   - **Match type**: Select from dropdown (equals, contains, etc.)
   - **Expected value**: Value to match against (not needed for exists/not_exists)
   - **Required/Optional**: Whether parameter is mandatory

### Via API

```bash
curl -X POST http://localhost:8080/api/mocks \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Filtered Products",
    "method": "GET",
    "path": "/api/products", 
    "queryParams": [
      {
        "key": "category",
        "type": "equals",
        "value": "electronics",
        "required": true
      },
      {
        "key": "sort", 
        "type": "starts_with",
        "value": "price",
        "required": false
      }
    ],
    "response": {
      "products": [...],
      "total": 15
    }
  }'
```

## Common Use Cases

### 1. API Versioning
```json
{
  "name": "API v2 Endpoint",
  "method": "GET",
  "path": "/api/users",
  "queryParams": [
    {
      "key": "version",
      "type": "equals", 
      "value": "2",
      "required": true
    }
  ]
}
```

### 2. Feature Flags
```json
{
  "name": "Beta Features Enabled",
  "method": "GET",
  "path": "/api/dashboard",
  "queryParams": [
    {
      "key": "beta",
      "type": "equals",
      "value": "true", 
      "required": true
    }
  ]
}
```

### 3. Content Filtering
```json
{
  "name": "Active Users Only",
  "method": "GET", 
  "path": "/api/users",
  "queryParams": [
    {
      "key": "status",
      "type": "equals",
      "value": "active",
      "required": true
    }
  ]
}
```

### 4. Search Functionality
```json
{
  "name": "User Search Results",
  "method": "GET",
  "path": "/api/users",
  "queryParams": [
    {
      "key": "search",
      "type": "contains",
      "value": "john",
      "required": true
    }
  ]
}
```

### 5. Debug/Development Mode
```json
{
  "name": "Debug Information",
  "method": "GET",
  "path": "/api/status", 
  "queryParams": [
    {
      "key": "debug",
      "type": "exists",
      "required": true
    }
  ]
}
```

## Testing and Debugging

### Test Mock Matching
Use the `/api/mocks/test` endpoint to test parameter matching:

```bash
curl -X POST http://localhost:8080/api/mocks/test \\
  -H "Content-Type: application/json" \\
  -d '{
    "method": "GET",
    "path": "/api/products",
    "query": {"category": "electronics", "sort": "price"}
  }'
```

### Analyze Requests
Use the `/api/mocks/analyze` endpoint to debug routing:

```bash
curl "http://localhost:8080/api/mocks/analyze?method=GET&path=/api/products&category=electronics"
```

## Best Practices

### 1. Parameter Naming
- Use consistent, descriptive parameter names
- Follow your API's existing conventions
- Use snake_case or camelCase consistently

### 2. Match Type Selection
- Use `equals` for exact values (status, IDs)
- Use `contains` for search terms
- Use `starts_with`/`ends_with` for prefixes/suffixes
- Use `regex` for complex validation patterns
- Use `exists`/`not_exists` for boolean flags

### 3. Required vs Optional
- Mark critical parameters as `required`
- Use `optional` for enhancement parameters (sorting, pagination)
- Provide fallback mocks for missing required parameters

### 4. Mock Organization
- Create specific mocks for common parameter combinations
- Use descriptive mock names that indicate parameter conditions
- Group related parameter mocks together

### 5. Error Handling
- Create mocks for invalid parameter values
- Return appropriate HTTP status codes (400 for bad requests)
- Provide helpful error messages in responses

## Examples

See `examples/query-parameter-examples.json` for complete working examples of all match types and common use cases.

## Troubleshooting

### Mock Not Matching
1. Check parameter names (case-sensitive)
2. Verify match type is appropriate for your use case
3. Test with required vs optional settings
4. Use the analyze endpoint to debug routing

### Multiple Mocks Matching
1. Review routing priority rules
2. Make parameter conditions more specific
3. Use combination of multiple parameters for uniqueness
4. Consider using headers for additional disambiguation
