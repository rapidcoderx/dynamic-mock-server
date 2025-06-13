# Export/Import and Test Generation Examples

## 🚀 Quick Start Guide

### 1. Export Your Mocks

#### Via UI
- Click "📤 Export Mocks" button
- Downloads: `mock-collection-YYYY-MM-DD.json`

#### Via API
```bash
curl http://localhost:8080/api/mocks/export > my-mocks.json
```

### 2. Import Mock Collections

#### Via UI
1. Click "📥 Import Mocks" button
2. Choose "📁 From File" or "📝 Paste JSON"
3. Select your exported JSON file or paste JSON content
4. Check "Replace existing mocks" if you want to overwrite duplicates
5. Click "📥 Import Mocks"

#### Via API
```bash
curl -X POST http://localhost:8080/api/mocks/import \
  -H "Content-Type: application/json" \
  -d @sample-import.json
```

### 3. Generate Test Collections

#### Postman Collection
```bash
# Download Postman collection
curl "http://localhost:8080/api/mocks/export/postman?baseUrl=http://localhost:8080" > collection.json

# Import into Postman:
# 1. Open Postman
# 2. File → Import
# 3. Select the downloaded collection.json
# 4. Start testing your mocks!
```

#### HTTPie Commands
```bash
# Download HTTPie test script
curl "http://localhost:8080/api/mocks/export/httpie?baseUrl=http://localhost:8080" > test-commands.txt

# Install HTTPie (if not already installed)
pip install httpie

# Run individual commands from the file
# Example commands will look like:
http GET http://localhost:8080/api/user x-mock-type:"success"
http POST http://localhost:8080/api/user Content-Type:application/json name="John Doe"
```

## 🎯 Advanced Usage

### Batch Import with Replacement
```bash
curl -X POST http://localhost:8080/api/mocks/import \
  -H "Content-Type: application/json" \
  -d '{
    "mocks": [...your mocks...],
    "replaceExisting": true
  }'
```

### Custom Base URL for Exports
```bash
# Generate collection for production
curl "http://localhost:8080/api/mocks/export/postman?baseUrl=https://api.production.com" > prod-collection.json

# Generate commands for staging
curl "http://localhost:8080/api/mocks/export/httpie?baseUrl=https://api.staging.com" > staging-tests.txt
```

## 🔧 Integration Examples

### CI/CD Pipeline Integration
```yaml
# .github/workflows/test-mocks.yml
name: Test Mock Endpoints
on: [push, pull_request]
jobs:
  test-mocks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Start Mock Server
        run: npm start &
      - name: Install HTTPie
        run: pip install httpie
      - name: Download Test Commands
        run: curl http://localhost:8080/api/mocks/export/httpie > tests.txt
      - name: Run Mock Tests
        run: bash tests.txt
```

### Development Workflow
```bash
# 1. Export mocks from dev environment
curl http://localhost:8080/api/mocks/export > dev-mocks.json

# 2. Share with team via git
git add dev-mocks.json
git commit -m "Update mock collection"
git push

# 3. Team members import the latest mocks
curl -X POST http://localhost:8080/api/mocks/import \
  -H "Content-Type: application/json" \
  -d @dev-mocks.json
```

## ⌨️ Keyboard Shortcuts

- `Ctrl + E` - Export mocks as JSON
- `Ctrl + I` - Open import modal  
- `Ctrl + P` - Export Postman collection
- `Ctrl + M` - View all mocks
- `Ctrl + N` - Focus on new mock form
- `ESC` - Close any open modal

## 📁 File Formats

### Export Format
```json
{
  "version": "1.0.0",
  "timestamp": "2025-06-13T12:00:00.000Z",
  "totalMocks": 2,
  "mocks": [
    {
      "id": "uuid-here",
      "name": "getUserSuccess",
      "method": "GET", 
      "path": "/api/user",
      "headers": {"x-mock-type": "success"},
      "response": {"id": 1, "name": "John"},
      "statusCode": 200,
      "exported": true
    }
  ]
}
```

### Import Requirements
- Must be valid JSON
- `mocks` array is required (or direct array of mocks)
- Each mock needs: `name`, `method`, `path`, `response`
- Optional: `headers`, `statusCode` (defaults to 200)
- IDs will be regenerated on import
