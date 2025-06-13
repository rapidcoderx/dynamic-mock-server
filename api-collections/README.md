# API Collections for Dynamic Mock Server

This directory contains comprehensive API collections for testing and using the Dynamic Mock Server.

## 📁 Files

### 1. `Dynamic-Mock-Server.postman_collection.json`
Complete Postman collection with all API endpoints and examples.

**Features:**
- Pre-configured environment variables
- Request/response examples for all operations
- Test scripts for automated workflows
- Organized into logical folders

**Import Instructions:**
1. Open Postman
2. Click "Import" button
3. Select the `Dynamic-Mock-Server.postman_collection.json` file
4. The collection will be imported with all requests organized in folders

### 2. `Dynamic-Mock-Server.httpie-desktop.json`
Native HTTPie Desktop collection with all API endpoints and examples.

**Features:**
- Native HTTPie Desktop format
- Pre-configured environment variables
- All CRUD operations with examples
- Organized requests with descriptions

**Import Instructions:**
1. Open HTTPie Desktop
2. Go to "File" → "Import" or use Ctrl/Cmd+I
3. Select the `Dynamic-Mock-Server.httpie-desktop.json` file
4. The collection will be imported with all requests and variables

### 3. `httpie-commands.sh`
Comprehensive HTTPie commands collection with examples for all API operations.

**Features:**
- Ready-to-run HTTPie commands
- Detailed examples and comments
- Advanced usage patterns
- Useful one-liners for common tasks

**Usage:**
```bash
# Make executable (if not already)
chmod +x httpie-commands.sh

# View all commands
cat httpie-commands.sh

# Run specific sections or copy individual commands
```

### 4. `demo.sh`
Interactive demo script that showcases the complete API workflow.

**Features:**
- End-to-end demonstration of all major operations
- Color-coded output with step-by-step explanations
- Automatic cleanup after demonstration
- Prerequisites validation

**Usage:**
```bash
# Ensure server is running first
npm start

# Run the demo in another terminal
./demo.sh
```

## 🚀 Getting Started

### Prerequisites
- Dynamic Mock Server running on `http://localhost:3000`
- **For Postman**: Postman application installed
- **For HTTPie Desktop**: HTTPie Desktop application installed
- **For HTTPie CLI**: HTTPie installed (`pip install httpie` or `brew install httpie`)

### Tool Compatibility

| Tool | Collection File | Format | Import Method |
|------|----------------|---------|---------------|
| **Postman** | `Dynamic-Mock-Server.postman_collection.json` | Postman v2.1 | File → Import |
| **HTTPie Desktop** | `Dynamic-Mock-Server.httpie-desktop.json` | HTTPie Desktop | File → Import |
| **HTTPie CLI** | `httpie-commands.sh` | Shell Script | Copy commands |

> **Note**: Postman collections are **not compatible** with HTTPie Desktop and vice versa. Each tool uses its own proprietary format.

### Environment Variables
Both collections use these default values:
- **Base URL**: `http://localhost:3000`
- **API Prefix**: `/api/v1`

You can modify these in Postman's environment settings or update the variables in the HTTPie script.

## 📋 API Operations Covered

### 1. Health & Configuration
- **Health Check**: `GET /api/v1/health`
- **Get Configuration**: `GET /api/v1/config`

### 2. Mock Management (CRUD)
- **List All Mocks**: `GET /api/v1/mocks`
- **Create Static Mock**: `POST /api/v1/mocks`
- **Create Dynamic Mock**: `POST /api/v1/mocks` (with dynamic placeholders)
- **Update Mock**: `PUT /api/v1/mocks/{id}`
- **Delete Mock**: `DELETE /api/v1/mocks/{id}`

### 3. Mock Testing & Analysis
- **Test Mock Endpoint**: `POST /api/v1/mocks/test`
- **Analyze Request**: `GET /api/v1/mocks/analyze`
- **Preview Dynamic Response**: `POST /api/v1/mocks/preview`
- **Get Available Placeholders**: `GET /api/v1/mocks/placeholders`

### 4. Import & Export
- **Export All Mocks**: `GET /api/v1/mocks/export`
- **Import Mocks**: `POST /api/v1/mocks/import`
- **Export Postman Collection**: `GET /api/v1/mocks/export/postman`
- **Export HTTPie Collection**: `GET /api/v1/mocks/export/httpie`

### 5. Mock Invocation
- Examples of calling the actual mock endpoints
- Different scenarios (static, dynamic, with headers, POST data)

## 🎯 Example Workflows

### Creating and Testing a Static Mock
1. **Create Mock**: Use "Create Static Mock" request
2. **Verify**: Use "List All Mocks" to confirm creation
3. **Test**: Use "Call User Profile Mock" to invoke the actual endpoint
4. **Update**: Use "Update Mock" to modify the response
5. **Clean up**: Use "Delete Mock" to remove when done

### Creating and Testing a Dynamic Mock
1. **Create Mock**: Use "Create Dynamic Mock" request
2. **Preview**: Use "Preview Dynamic Response" to see sample output
3. **Test**: Call the mock endpoint multiple times to see different responses
4. **Analyze**: Use "Get Available Placeholders" to see all available dynamic values

### Bulk Operations
1. **Export**: Use "Export All Mocks" to backup current mocks
2. **Import**: Use "Import Mocks" to restore or add multiple mocks
3. **Generate Collections**: Use export endpoints to create new API collections

## 🔧 Advanced Usage

### HTTPie with jq for Better Output
```bash
# Pretty print all mocks
http GET localhost:3000/api/v1/mocks | jq .

# Get only mock names and paths
http GET localhost:3000/api/v1/mocks | jq '.[] | {name: .name, method: .method, path: .path}'

# Filter dynamic mocks only
http GET localhost:3000/api/v1/mocks | jq '.[] | select(.dynamic == true)'
```

### Postman Environment Setup
1. Create a new environment in Postman
2. Add variables:
   - `baseUrl`: `http://localhost:3000`
   - `apiPrefix`: `/api/v1`
   - `createdMockId`: (will be set automatically by test scripts)

### Automation Scripts
The Postman collection includes test scripts that:
- Store created mock IDs for use in subsequent requests
- Validate response structure and content
- Set up data for dependent requests

## 🌍 Different Storage Backends

The collections work with all storage backends:
- **File Storage** (default): No additional setup required
- **PostgreSQL**: Ensure database is configured and running
- **MongoDB**: Ensure database is configured and running

Use the health check endpoint to verify storage backend status:
```bash
http GET localhost:3000/api/v1/health
```

## 📝 Tips

1. **Start with Health Check**: Always verify the server is running and healthy
2. **Use Test Endpoint**: Before calling actual mocks, use the test endpoint to verify matching
3. **Check Available Placeholders**: When creating dynamic mocks, reference the placeholders endpoint
4. **Save Mock IDs**: Store mock IDs from create responses for update/delete operations
5. **Use Delays Sparingly**: Add delays only when testing timeout scenarios
6. **Header Matching**: Use header matching for testing authentication and routing scenarios

## 🐛 Troubleshooting

### Common Issues
1. **Connection Refused**: Ensure the mock server is running on the correct port
2. **404 Not Found**: Check the API prefix and endpoint paths
3. **Mock Not Matching**: Use the analyze endpoint to debug request matching
4. **Dynamic Response Errors**: Use the preview endpoint to test dynamic templates

### Getting Help
- Check server logs for detailed error information
- Use the health endpoint to verify system status
- Review the main README.md for setup and configuration details
- Check docs/DATABASE_STORAGE.md for database-specific issues
