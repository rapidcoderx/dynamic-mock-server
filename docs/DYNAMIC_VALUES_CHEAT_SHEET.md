# 🎲 Dynamic Values & Delays Cheat Sheet

Quick reference for dynamic mock server placeholders and delay configurations.

## 🏃‍♂️ Quick Start

1. Enable "Dynamic Values" in Advanced Options ⚙️
2. Use `{{placeholder}}` syntax in your response JSON
3. Configure delays for realistic timing
4. Test with "Generate Preview" 🔄

---

## 📋 Common Placeholders

### 👤 User Data
```json
{
  "id": "{{uuid}}",           // a1b2c3d4-e5f6-7890-...
  "name": "{{name}}",         // Jane Smith
  "email": "{{email}}",       // jane.smith@email.com
  "phone": "{{phone}}",       // +1-555-123-4567
  "username": "{{username}}"  // jane_smith123
}
```

### 🕐 Time & Date
```json
{
  "timestamp": "{{timestamp}}", // 2025-06-13T12:45:23.123Z
  "date": "{{date}}",          // 2025-06-12
  "time": "{{time}}",          // 12:45:23
  "unix": "{{unix}}"           // 1718280323
}
```

### 🔢 Numbers & Random
```json
{
  "score": "{{number:1:100}}", // Random 1-100
  "price": "{{float:10:500}}", // Random decimal 10.00-500.00
  "active": "{{boolean}}",     // true or false
  "status": "{{oneOf:active,pending,inactive}}" // Pick one
}
```

### 🌐 Internet & Text
```json
{
  "url": "{{url}}",           // https://example.com
  "domain": "{{domain}}",     // example.com
  "ip": "{{ip}}",            // 192.168.1.1
  "words": "{{words:3}}",    // "lorem ipsum dolor"
  "sentence": "{{sentence}}" // "Lorem ipsum dolor sit amet."
}
```

### 🏢 Business & Location
```json
{
  "company": "{{company}}",   // Tech Solutions Inc.
  "job": "{{jobTitle}}",      // Senior Developer
  "address": "{{address}}",   // 123 Main Street
  "city": "{{city}}",         // New York
  "country": "{{country}}"    // United States
}
```

### 🎯 Arrays & Complex
```json
{
  "items": "{{arrayOf:5:name}}",     // Array of 5 names
  "tags": "{{arrayOf:3:word}}",      // Array of 3 words  
  "scores": "{{arrayOf:10:number:1:100}}" // Array of 10 numbers 1-100
}
```

---

## ⏱️ Delay Types

### Fixed Delay
```json
{
  "delay": 500  // Always 500ms
}
```

### Random Delay
```json
{
  "delay": {
    "type": "random",
    "min": 200,
    "max": 1000
  }
}
```

### Network Simulation
```json
{
  "delay": {
    "type": "network"  // Realistic patterns
  }
}
```

**Network Distribution:**
- 70% Fast (50-200ms)
- 20% Medium (200-800ms) 
- 8% Slow (800-2000ms)
- 2% Very Slow (2000-5000ms)

---

## 🎯 Common Patterns

### User Profile
```json
{
  "user": {
    "id": "{{uuid}}",
    "name": "{{name}}",
    "email": "{{email}}",
    "avatar": "{{avatar}}",
    "created": "{{timestamp}}",
    "active": "{{boolean}}"
  }
}
```

### Product Listing
```json
{
  "products": "{{arrayOf:10:product}}",
  "total": "{{number:50:200}}",
  "page": 1,
  "generated": "{{timestamp}}"
}
```

### API Response with Metadata
```json
{
  "data": {
    "id": "{{uuid}}",
    "value": "{{words:3}}"
  },
  "metadata": {
    "requestId": "{{requestId}}",
    "timestamp": "{{timestamp}}",
    "processingTime": "{{number:10:500}}"
  }
}
```

---

## 🔧 Testing Scenarios

### Fast Response (Cache)
```json
{
  "delay": 50,
  "response": { "cached": true, "data": "{{word}}" }
}
```

### Database Query
```json
{
  "delay": { "type": "random", "min": 200, "max": 500 },
  "response": { "results": "{{arrayOf:10:name}}" }
}
```

### External API Call
```json
{
  "delay": { "type": "network" },
  "response": { "external": true, "data": "{{sentence}}" }
}
```

### Heavy Processing
```json
{
  "delay": { "type": "random", "min": 2000, "max": 5000 },
  "response": { "processed": true, "result": "{{paragraph}}" }
}
```

---

## 🚀 UI Features

- **📋 Show Placeholders**: Browse all available placeholders
- **👁️ Preview Generator**: Test templates before saving
- **📄 Load Example**: Insert sample template
- **⚙️ Advanced Options**: Configure delays and dynamic values
- **🔄 Generate Preview**: See output with current placeholders

---

## 🔗 Resources

- **[Complete Guide](DYNAMIC_VALUES_AND_DELAYS.md)** - Full documentation
- **[Examples](../examples/dynamic-values-examples.json)** - Ready-to-import mocks
- **[Main README](../README.md)** - Project overview

---

**💡 Pro Tips:**
- Use realistic ranges for numbers: `{{number:1:100}}`
- Combine placeholders: `"email": "{{firstname}}.{{lastname}}@{{domain}}"`
- Test with different delays to simulate various network conditions
- Use `{{requestId}}` to track requests across logs
