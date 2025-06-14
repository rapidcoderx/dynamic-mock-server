# Analytics Tracking - What Gets Tracked?

## Overview
The analytics dashboard has been configured to track only **meaningful mock-related requests** and filter out system/administrative calls to provide clean, actionable data.

## ✅ TRACKED REQUESTS

### Mock Calls
- **Actual mock endpoints**: Any custom endpoints you create (e.g., `/api/users`, `/products`, etc.)
- **Mock management API**: `/api/mocks/*` operations (create, read, update, delete mocks)
- **Mock preview API**: `/api/mocks/preview` (when testing mock responses)

### Request Data Captured
For each tracked request, we capture:
- **Basic Info**: Method, path, timestamp, IP address
- **Performance**: Response time, status code, response size
- **Content**: Headers, query parameters, request body size
- **Mock Matching**: Which mock (if any) handled the request
- **User Context**: User agent, request ID

## ❌ FILTERED OUT (NOT TRACKED)

### Analytics API Calls
- `/api/analytics/*` - Dashboard data, export, clear operations
- `/api/mocks/*` - Mock management operations (create, read, update, delete)
- These would create noise and circular tracking

### System/Administrative Calls
- `/api/config` - Configuration API
- `/` - Root page/dashboard UI
- `/favicon.ico`, `/favicon.svg` - Browser favicon requests
- `/public/*` - Static files (CSS, JS, images)
- `/styles.css`, `/icon.svg` - UI assets
- `/.well-known/*` - Browser well-known paths (Chrome DevTools, etc.)

## 📊 What This Means for Your Dashboard

### Clean Data
- **Request History**: Only shows actual API calls your clients made
- **Mock Hit Statistics**: Only counts real mock usage
- **Performance Metrics**: Response times for actual API calls only
- **Usage Patterns**: Genuine API usage trends without UI noise

### Accurate Analytics
- **Hit Rate**: True percentage of requests that matched mocks
- **Popular Endpoints**: Real most-used mock endpoints
- **Error Rates**: Actual API errors, not dashboard loading issues
- **Response Time Distribution**: Performance of your actual API responses

## 🧪 Testing the Filtering

Use these scripts to verify the filtering works correctly:

```bash
# Test that analytics calls are filtered out
./tests/scripts/test-analytics-filtering.sh

# Clear existing noisy data and start fresh
./tests/scripts/clear-analytics.sh

# Test all analytics endpoints work
./tests/scripts/test-analytics-api.sh
```

## 🚀 Best Practices

1. **Start Fresh**: Run `./clear-analytics.sh` to remove any existing noisy data
2. **Monitor Real Usage**: The dashboard now shows only meaningful API interactions
3. **Focus on Performance**: Response time metrics reflect actual mock performance
4. **Track Adoption**: Mock hit rates show real API usage patterns

## 🔧 Customizing Filters

If you need to modify what gets tracked, edit the `skipPaths` array in `server/middleware/analytics.js`:

```javascript
const skipPaths = [
    '/api/analytics',     // Analytics API calls
    '/api/config',        // Configuration API
    '/favicon.ico',       // Browser favicon requests
    '/public/',          // Static files
    '/styles.css',       // CSS files
    '/icon.svg',         // Icon files
    '/favicon.svg'       // SVG favicon
];
```

You can add or remove paths based on your specific needs.
