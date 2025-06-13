# 🎲 Dynamic Values & Response Delays

A comprehensive guide to using dynamic value generation and response delays in the Dynamic Mock Server.

---

## 📖 Overview

The Dynamic Mock Server supports **realistic data simulation** through:
- **Dynamic Value Generation** using Faker.js with 60+ placeholder types
- **Response Delays** to simulate network latency and processing time
- **Template System** for flexible data generation
- **Preview Functionality** for testing before deployment

---

## ⚙️ Enabling Dynamic Values

### Dynamic Value Generation Control

When creating or editing a mock, you can control whether dynamic placeholders are processed:

**Location**: ⚙️ Advanced Options → "Enable dynamic value generation" checkbox

#### ✅ When ENABLED (Checkbox Checked)
- Placeholders like `{{name}}`, `{{email}}`, `{{uuid}}` are replaced with real generated values
- Each API call returns different realistic data
- Perfect for testing with varied, lifelike data

**Example:**
```json
// Template: {"user": "{{name}}", "email": "{{email}}"}
// Response: {"user": "Alice Johnson", "email": "alice.johnson@example.com"}
```

#### ☐ When DISABLED (Checkbox Unchecked)  
- Placeholders are returned as literal strings without processing
- Responses are static and predictable
- Useful for debugging template syntax or when exact responses are needed

**Example:**
```json
// Template: {"user": "{{name}}", "email": "{{email}}"}  
// Response: {"user": "{{name}}", "email": "{{email}}"}
```

**💡 Pro Tip**: Use the Preview Generator (📋 Show Placeholders → Preview section) to test your templates before saving!

---

## 🏗️ Dynamic Value Placeholders

### 🕐 Time & Date Placeholders

Generate timestamps, dates, and time values:

```json
{
  "timestamp": "{{timestamp}}",      // Current ISO timestamp: "2025-06-13T12:45:23.123Z"
  "now": "{{now}}",                  // Same as timestamp
  "date": "{{date}}",                // Random recent date: "2025-06-12"
  "time": "{{time}}",                // Current time: "12:45:23"
  "unix": "{{unix}}"                 // Unix timestamp: 1718280323
}
```

**Example Response:**
```json
{
  "event": {
    "created": "{{timestamp}}",
    "scheduled": "{{date}}",
    "startTime": "{{time}}"
  }
}
```

### 👤 Person & Identity Placeholders

Generate realistic user data:

```json
{
  "id": "{{uuid}}",                  // UUID: "123e4567-e89b-12d3-a456-426614174000"
  "name": "{{name}}",                // Full name: "John Doe"
  "firstName": "{{firstname}}",       // First name: "John"
  "lastName": "{{lastname}}",        // Last name: "Doe"
  "email": "{{email}}",              // Email: "john.doe@example.com"
  "phone": "{{phone}}",              // Phone: "+1-555-123-4567"
  "username": "{{username}}"         // Username: "john_doe123"
}
```

**Example Response:**
```json
{
  "user": {
    "id": "{{uuid}}",
    "profile": {
      "name": "{{name}}",
      "email": "{{email}}",
      "phone": "{{phone}}"
    },
    "account": {
      "username": "{{username}}",
      "created": "{{timestamp}}"
    }
  }
}
```

### 🏢 Business & Location Placeholders

Generate company and address information:

```json
{
  "company": "{{company}}",          // Company: "Tech Solutions Inc."
  "jobTitle": "{{jobTitle}}",        // Job: "Senior Developer"
  "department": "{{department}}",    // Department: "Engineering"
  "address": "{{address}}",          // Address: "123 Main Street"
  "city": "{{city}}",                // City: "New York"
  "country": "{{country}}",          // Country: "United States"
  "zipcode": "{{zipcode}}"           // Zip: "10001"
}
```

**Example Response:**
```json
{
  "organization": {
    "name": "{{company}}",
    "location": {
      "address": "{{address}}",
      "city": "{{city}}",
      "country": "{{country}}",
      "postal": "{{zipcode}}"
    },
    "contact": {
      "email": "info@{{domain}}",
      "phone": "{{phone}}"
    }
  }
}
```

### 🔢 Numbers & Data Placeholders

Generate numeric values and random selections:

```json
{
  "randomNumber": "{{number}}",           // Random number: 42
  "numberRange": "{{number:1:100}}",      // Number between 1-100: 75
  "decimal": "{{float:0:10}}",            // Float 0-10: 7.23
  "boolean": "{{boolean}}",               // Boolean: true/false
  "choice": "{{oneOf:red,blue,green}}",   // Pick one: "blue"
  "status": "{{oneOf:active,inactive,pending}}"  // Status: "active"
}
```

**Example Response:**
```json
{
  "product": {
    "id": "{{number:1000:9999}}",
    "price": "{{float:10:500}}",
    "inStock": "{{boolean}}",
    "category": "{{oneOf:electronics,clothing,books,toys}}",
    "rating": "{{float:1:5}}"
  }
}
```

### 🌐 Internet & URL Placeholders

Generate web-related data:

```json
{
  "url": "{{url}}",                  // URL: "https://example.com"
  "domain": "{{domain}}",            // Domain: "example.com"
  "ip": "{{ip}}",                    // IP: "192.168.1.1"
  "mac": "{{mac}}",                  // MAC: "02:42:ac:11:00:02"
  "image": "{{image}}",              // Image: "https://picsum.photos/640/480"
  "avatar": "{{avatar}}"             // Avatar: random avatar URL
}
```

**Custom Image Sizes:**
```json
{
  "thumbnail": "{{image:150:150}}",      // 150x150 image
  "banner": "{{image:800:200}}",         // 800x200 banner
  "profile": "{{avatar}}"                // Random avatar
}
```

### 📝 Text & Content Placeholders

Generate text content:

```json
{
  "word": "{{word}}",                // Single word: "lorem"
  "words": "{{words}}",              // 3 words: "lorem ipsum dolor"
  "manyWords": "{{words:5}}",        // 5 words: "lorem ipsum dolor sit amet"
  "sentence": "{{sentence}}",        // Full sentence
  "paragraph": "{{paragraph}}",      // Full paragraph
  "title": "{{title}}",              // Short title (3 words)
  "color": "{{color}}"               // Color name: "blue"
}
```

**Example Response:**
```json
{
  "article": {
    "title": "{{title}}",
    "summary": "{{sentence}}",
    "content": "{{paragraph}}",
    "tags": "{{words:4}}".split(" "),
    "category": "{{word}}"
  }
}
```

### 🔗 Request Context Placeholders

Access current request information:

```json
{
  "requestId": "{{requestId}}",      // From X-Request-ID header or generated
  "userAgent": "{{userAgent}}",      // Client user agent
  "requestPath": "{{requestPath}}",  // Current request path
  "requestMethod": "{{requestMethod}}" // HTTP method (GET, POST, etc.)
}
```

**Example Response:**
```json
{
  "metadata": {
    "requestId": "{{requestId}}",
    "timestamp": "{{timestamp}}",
    "source": {
      "path": "{{requestPath}}",
      "method": "{{requestMethod}}",
      "userAgent": "{{userAgent}}"
    }
  }
}
```

### 🎯 Advanced Placeholders

Create complex data structures:

```json
{
  "array": "{{arrayOf:5:name}}",     // Array of 5 names
  "mixedArray": "{{arrayOf:3:word}}", // Array of 3 words
  "randomChoice": "{{oneOf:success,error,pending,processing}}"
}
```

**Example Complex Response:**
```json
{
  "users": "{{arrayOf:10:user}}",
  "statuses": "{{arrayOf:5:oneOf:active,inactive}}",
  "scores": "{{arrayOf:8:number:1:100}}",
  "metadata": {
    "total": "{{number:50:200}}",
    "generated": "{{timestamp}}",
    "requestId": "{{requestId}}"
  }
}
```

---

## ⏱️ Response Delays (Sleep)

Simulate realistic network conditions and server processing times to test how your application handles different latency scenarios.

### 🔧 Delay Configuration

#### Fixed Delay
Always return responses after a specific time:

```json
{
  "name": "User Profile",
  "method": "GET",
  "path": "/api/user",
  "response": { "user": "{{name}}" },
  "delay": 500,  // Always 500ms delay
  "dynamic": true
}
```

#### Random Delay
Variable delays within a range:

```json
{
  "name": "Search Results",
  "method": "GET", 
  "path": "/api/search",
  "response": { "results": "{{arrayOf:10:word}}" },
  "delay": {
    "type": "random",
    "min": 200,     // Minimum 200ms
    "max": 1500     // Maximum 1500ms
  },
  "dynamic": true
}
```

#### Network Simulation
Realistic network delay patterns:

```json
{
  "name": "Data Upload",
  "method": "POST",
  "path": "/api/upload",
  "response": { "status": "success", "id": "{{uuid}}" },
  "delay": {
    "type": "network"  // Simulates real network conditions
  },
  "dynamic": true
}
```

**Network Simulation Distribution:**
- 70% Fast responses (50-200ms) - Local/cached data
- 20% Medium responses (200-800ms) - Database queries
- 8% Slow responses (800-2000ms) - External API calls
- 2% Very slow responses (2000-5000ms) - Heavy processing

### 📊 Delay Use Cases

#### API Testing
```json
{
  "loginFast": {
    "delay": 100,  // Fast login for success flows
    "response": { "token": "{{uuid}}", "user": "{{name}}" }
  },
  "loginSlow": {
    "delay": 3000,  // Slow login to test loading states
    "response": { "error": "Server timeout" },
    "statusCode": 504
  }
}
```

#### Load Testing Simulation
```json
{
  "lowLoad": {
    "delay": { "type": "random", "min": 50, "max": 200 }
  },
  "highLoad": {
    "delay": { "type": "random", "min": 1000, "max": 5000 }
  },
  "networkIssues": {
    "delay": { "type": "network" }
  }
}
```

#### Different Service Types
```json
{
  "cacheLookup": {
    "delay": 50,  // Fast cached responses
    "response": { "cached": true, "data": "{{word}}" }
  },
  "databaseQuery": {
    "delay": { "type": "random", "min": 200, "max": 800 },
    "response": { "results": "{{arrayOf:10:name}}" }
  },
  "externalAPI": {
    "delay": { "type": "random", "min": 500, "max": 2000 },
    "response": { "external": true, "data": "{{sentence}}" }
  },
  "heavyProcessing": {
    "delay": { "type": "random", "min": 2000, "max": 10000 },
    "response": { "processed": true, "result": "{{paragraph}}" }
  }
}
```

---

## 🔬 Testing & Preview

### Preview Generator
Test your dynamic templates before saving:

1. **Open Placeholders Modal**: Click "📋 Show Placeholders" 
2. **Use Preview Section**: Enter your JSON template
3. **Generate Preview**: Click "🔄 Generate Preview"
4. **See Results**: View the generated output instantly

**Example Preview Input:**
```json
{
  "user": {
    "id": "{{uuid}}",
    "name": "{{name}}",
    "email": "{{email}}",
    "created": "{{timestamp}}"
  },
  "metrics": {
    "score": "{{number:1:100}}",
    "active": "{{boolean}}"
  }
}
```

### API Testing with Delays

Test your mock endpoints with different delay scenarios:

```bash
# Fast response (no delay)
curl http://localhost:8080/api/users/fast

# Medium delay (500ms)
curl http://localhost:8080/api/users/medium

# Slow response (2-5s random)
curl http://localhost:8080/api/users/slow

# Network simulation
curl http://localhost:8080/api/users/network
```

### Response Headers for Debugging

Dynamic mocks include helpful debugging headers:

```http
HTTP/1.1 200 OK
X-Mock-Dynamic: true
X-Mock-Processing-Time: 1250ms
X-Mock-Generated: 2025-06-13T12:45:23.123Z
Content-Type: application/json

{
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Jane Smith",
    "created": "2025-06-13T12:45:23.123Z"
  }
}
```

---

## 📚 Complete Examples

### E-commerce Product API
```json
{
  "name": "Product Catalog",
  "method": "GET",
  "path": "/api/products",
  "response": {
    "products": [
      {
        "id": "{{uuid}}",
        "name": "{{words:2}}",
        "description": "{{sentence}}",
        "price": "{{float:10:500}}",
        "category": "{{oneOf:electronics,clothing,books,home}}",
        "inStock": "{{boolean}}",
        "rating": "{{float:1:5}}",
        "reviews": "{{number:0:1000}}",
        "image": "{{image:300:300}}",
        "created": "{{date}}"
      }
    ],
    "pagination": {
      "total": "{{number:50:500}}",
      "page": 1,
      "limit": 20
    },
    "metadata": {
      "generated": "{{timestamp}}",
      "requestId": "{{requestId}}"
    }
  },
  "delay": {
    "type": "random",
    "min": 200,
    "max": 800
  },
  "dynamic": true
}
```

### User Management System
```json
{
  "name": "Create User",
  "method": "POST", 
  "path": "/api/users",
  "response": {
    "user": {
      "id": "{{uuid}}",
      "profile": {
        "firstName": "{{firstname}}",
        "lastName": "{{lastname}}",
        "email": "{{email}}",
        "phone": "{{phone}}",
        "avatar": "{{avatar}}"
      },
      "account": {
        "username": "{{username}}",
        "role": "{{oneOf:user,admin,moderator}}",
        "status": "{{oneOf:active,pending,inactive}}",
        "created": "{{timestamp}}",
        "lastLogin": null
      },
      "preferences": {
        "theme": "{{oneOf:light,dark,auto}}",
        "language": "{{oneOf:en,es,fr,de}}",
        "notifications": "{{boolean}}"
      },
      "stats": {
        "loginCount": 0,
        "score": "{{number:0:1000}}"
      }
    },
    "metadata": {
      "created": "{{timestamp}}",
      "requestId": "{{requestId}}"
    }
  },
  "statusCode": 201,
  "delay": {
    "type": "fixed",
    "min": 500
  },
  "dynamic": true
}
```

### Real-time Data Simulation
```json
{
  "name": "Live Metrics",
  "method": "GET",
  "path": "/api/metrics/live",
  "response": {
    "metrics": {
      "timestamp": "{{timestamp}}",
      "cpu": "{{float:0:100}}",
      "memory": "{{float:0:100}}",
      "disk": "{{float:0:100}}",
      "network": {
        "in": "{{number:0:1000}}",
        "out": "{{number:0:1000}}"
      }
    },
    "alerts": "{{arrayOf:{{number:0:5}}:oneOf:high_cpu,low_memory,disk_full}}",
    "status": "{{oneOf:healthy,warning,critical}}",
    "uptime": "{{number:3600:86400}}",
    "generated": "{{timestamp}}"
  },
  "delay": {
    "type": "network"
  },
  "dynamic": true
}
```

---

## 🚀 Best Practices

### 1. **Realistic Data Patterns**
```json
{
  "email": "{{email}}",              // ✅ Use dedicated placeholders
  "userId": "{{uuid}}",              // ✅ UUIDs for IDs
  "score": "{{float:0:100}}",        // ✅ Bounded numbers
  "status": "{{oneOf:active,inactive}}" // ✅ Controlled choices
}
```

### 2. **Appropriate Delays**
```json
{
  "fastCache": { "delay": 50 },           // ✅ Cache responses
  "database": { "delay": {"type": "random", "min": 200, "max": 500} }, // ✅ DB queries
  "external": { "delay": {"type": "network"} }  // ✅ External APIs
}
```

### 3. **Consistent Structures**
```json
{
  "data": "{{actual_content}}",      // ✅ Main data
  "metadata": {                      // ✅ Metadata wrapper
    "timestamp": "{{timestamp}}",
    "requestId": "{{requestId}}"
  }
}
```

### 4. **Testing Scenarios**
- Create multiple mocks with different delays for load testing
- Use network simulation for realistic integration testing  
- Test timeout handling with very slow responses
- Validate loading states with medium delays

---

## 📁 Example Files

Check out these example files in the `/examples` directory:

- `dynamic-values-examples.json` - Complete dynamic mock collection
- `sample-import.json` - Basic import examples
- `EXPORT_IMPORT_GUIDE.md` - Import/export documentation

---

## 🔧 Troubleshooting

### Common Issues

**Dynamic values not generating:**
- ✅ Ensure "Enable dynamic values" is checked
- ✅ Verify placeholder syntax: `{{placeholder}}`
- ✅ Check for JSON syntax errors

**Delays not working:**
- ✅ Configure delay in Advanced Options
- ✅ Check server logs for delay application
- ✅ Verify delay configuration format

**Placeholder errors:**
- ✅ Use the "Show Placeholders" modal for reference
- ✅ Test with "Generate Preview" before saving
- ✅ Check console for detailed error messages

### Debug Headers

Check response headers for debugging information:
- `X-Mock-Dynamic: true` - Confirms dynamic processing
- `X-Mock-Processing-Time: 500ms` - Shows actual delay applied
- `X-Mock-Generated: timestamp` - Generation timestamp

---

Made with ❤️ for realistic API mocking and testing
