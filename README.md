# 🌊 Dynamic Mock Server

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Features](https://img.shields.io/badge/Features-Dynamic%20Values%20%26%20Delays-blue)
![UI](https://img.shields.io/badge/UI-Liquid%20Glass%20Theme-purple)
![Integration](https://img.shields.io/badge/Export-JSON%20%7C%20Postman%20%7C%20HTTPie-orange)

A sleek, modern mock server with a liquid-glass UI and dynamic API capabilities. Configure and simulate API responses easily for local testing, demos, or prototyping – all with a beautiful frontend and modular backend.

## 🏆 Key Achievements

**🎯 Production-Ready**: Complete CRUD operations, persistent storage, and robust error handling  
**🎲 Dynamic & Intelligent**: 60+ Faker.js placeholders with realistic response delays  
**🔄 Integration-Friendly**: Export to JSON, Postman collections, and HTTPie commands  
**🎨 Modern UX**: Liquid glass UI with keyboard shortcuts and smart notifications  
**📚 Well-Documented**: Comprehensive guides, examples, and API reference  

> *Ready for real-world use with enterprise-grade features and developer-focused design*

---

## ✨ Features

- 🧱 **Complete Mock Management**:
  - Create mocks with unique names, paths, HTTP methods
  - Optional headers (as JSON) for advanced routing
  - Custom response body (as JSON) with status codes
  - Edit existing mocks with full validation
  - Delete mocks with confirmation dialogs
- 🎲 **Dynamic Values & Response Delays**:
  - Dynamic value generation using Faker.js (names, emails, timestamps, UUIDs, etc.)
  - Template placeholders for realistic data ({{name}}, {{email}}, {{timestamp}})
  - Response delays (fixed, random, network simulation)
  - Preview functionality for testing dynamic responses
  - 60+ built-in placeholder types across multiple categories
- 📦 **Persistent Storage**: File-based mock storage (`mockStore.json`)
- 👁️ **Rich UI Experience**: 
  - Modal-based mock viewer with full details
  - Smart notification system with contextual feedback
  - Responsive liquid glass theme using Tailwind CSS v4
- 🔌 **Dynamic Configuration**: Config-driven `apiPrefix` support
- 🛠️ **Developer Experience**: 
  - Comprehensive logging and request matching validation
  - Real-time mock conflict detection and analysis
  - Keyboard shortcuts and intuitive navigation
- 🧩 **Modular Architecture**: Clean separation with `routes/`, `utils/`, and storage strategies

---

## 🛠️ Project Structure

```
/server
  ├── index.js                # Entry point with Express server
  ├── logger.js               # Centralized logging system
  ├── security.js             # Security middleware
  ├── tracer.js               # Request tracing utilities
  └── routes/
      └── mockRoutes.js       # Complete mock CRUD operations

/utils
  ├── matcher.js              # Advanced mock matching logic
  ├── storage.js              # Mock persistence utilities
  └── storageStrategy.js      # File-based storage implementation

/public
  ├── index.html              # Modern liquid glass frontend
  ├── styles.css              # Compiled Tailwind CSS
  ├── favicon.svg             # App favicon
  └── icon.svg                # App icon

/src
  └── styles.css              # Source Tailwind CSS with custom components

/mocks
  └── mock-config.json        # Persistent mock storage

/docs
  ├── HEADER_ROUTING.md       # Documentation for header-based routing
  ├── DYNAMIC_VALUES_AND_DELAYS.md  # Complete guide to dynamic values and delays
  └── DYNAMIC_VALUES_CHEAT_SHEET.md # Quick reference for placeholders and delays

/examples
  ├── header-routing-examples.json  # Example configurations
  └── dynamic-values-examples.json  # Dynamic values and delay examples
```

---

## 🚀 Getting Started

### 1. Install & Run

```bash
# Install dependencies
npm install

# Build CSS (production)
npm run build-css-prod

# Start development server
npm run dev

# Or start production server
npm start
```

### 2. Access App

Open: [http://localhost:8080](http://localhost:8080)

### 3. Quick Start with Dynamic Values

1. **Create a Dynamic Mock**:
   - Click "➕ Add Mock" 
   - Fill in basic details (name, method, path)
   - Expand "⚙️ Advanced Options"
   - Check "Enable dynamic value generation"
   - Use placeholders in response: `{"user": "{{name}}", "id": "{{uuid}}"}`
   - Set delay type (optional): Fixed, Random, or Network simulation

2. **Test Your Dynamic Mock**:
   ```bash
   curl http://localhost:8080/api/user
   # Returns: {"user": "Jane Smith", "id": "a1b2c3d4-..."}
   
   curl http://localhost:8080/api/user  
   # Returns: {"user": "Bob Johnson", "id": "x9y8z7w6-..."}
   ```

3. **Explore Placeholders**:
   - Click "📋 Show Placeholders" to see all 60+ options
   - Use the preview generator to test templates
   - Copy examples from the documentation

### 4. Build & Development Commands

```bash
# CSS Development (watch mode)
npm run build-css

# CSS Production (minified)
npm run build-css-prod

# Run tests
npm test
```

### 5. Environment Configuration

```bash
# Optional environment variables (create .env file)
PORT=8080                    # Server port (default: 8080)
API_PREFIX=/api              # API prefix for mock endpoints (default: /api)
LOG_DEV_REQUESTS=false       # Show filtered dev tool requests in logs (default: false)
```

The server automatically filters out noisy development tool requests (Chrome DevTools, favicon requests, etc.) to keep logs clean. Set `LOG_DEV_REQUESTS=true` if you need to debug these requests.

---

## 🧪 Testing Mocks

### ✅ Via UI
- **Create**: Add new mocks via the intuitive form interface
- **View**: Browse all mocks in a beautiful modal with search and filtering
- **Edit**: Modify existing mocks with inline editing capabilities
- **Delete**: Remove mocks with confirmation dialogs for safety
- **Test**: Built-in mock testing functionality to verify request matching

### 📬 Via API Endpoints

#### Mock Management
```bash
# List all mocks
GET http://localhost:8080/api/mocks

# Create a new mock
POST http://localhost:8080/api/mocks
Content-Type: application/json
{
  "name": "getUserSuccess",
  "method": "GET",
  "path": "/api/user",
  "headers": {"x-mock-type": "success"},
  "response": {"id": 1, "name": "John Doe"},
  "statusCode": 200
}

# Create a dynamic mock with delays
POST http://localhost:8080/api/mocks
Content-Type: application/json
{
  "name": "Dynamic User Profile",
  "method": "GET",
  "path": "/api/user/profile",
  "response": {
    "user": {
      "id": "{{uuid}}",
      "name": "{{name}}",
      "email": "{{email}}",
      "created": "{{timestamp}}"
    }
  },
  "delay": {
    "type": "random",
    "min": 200,
    "max": 800
  },
  "dynamic": true,
  "statusCode": 200
}

# Update a mock
PUT http://localhost:8080/api/mocks/{id}

# Delete a mock
DELETE http://localhost:8080/api/mocks/{id}

# Test mock matching
POST http://localhost:8080/api/mocks/test
Content-Type: application/json
{
  "method": "GET",
  "path": "/api/user",
  "headers": {"x-mock-type": "success"}
}

# Analyze mock conflicts
GET http://localhost:8080/api/mocks/analyze

# Export all mocks as JSON
GET http://localhost:8080/api/mocks/export

# Import mocks from JSON
POST http://localhost:8080/api/mocks/import
Content-Type: application/json
{
  "mocks": [...],
  "replaceExisting": false
}

# Export Postman collection
GET http://localhost:8080/api/mocks/export/postman?baseUrl=http://localhost:8080

# Export HTTPie commands
GET http://localhost:8080/api/mocks/export/httpie?baseUrl=http://localhost:8080
```

#### Using Your Mocked APIs
```bash
# Example: Call your mocked endpoint
GET http://localhost:8080/api/user
x-mock-type: success
```

### 🔄 Export/Import & Test Generation

#### Export Mock Collections
- **JSON Export**: Download complete mock collections with metadata
- **Postman Collections**: Generate ready-to-use Postman collections with example requests/responses
- **HTTPie Commands**: Export formatted command-line test scripts

#### Import Mock Collections
- **File Upload**: Import JSON files from previous exports
- **JSON Paste**: Direct JSON import via textarea
- **Duplicate Handling**: Option to replace or skip existing mocks
- **Validation**: Comprehensive error reporting during import

#### Keyboard Shortcuts
- `Ctrl + N`: Add new mock (＋)
- `Ctrl + M`: View all mocks (👁️) 
- `Ctrl + E`: Export mocks as JSON (⬆️)
- `Ctrl + I`: Open import modal (⬇️)
- `Ctrl + P`: Export Postman collection (📋)
- `Ctrl + H`: Show help & shortcuts (❓)
- `ESC`: Close any open modal

---

## 📚 Documentation

- **[🎲 Dynamic Values & Response Delays Guide](docs/DYNAMIC_VALUES_AND_DELAYS.md)** - Complete guide to dynamic value generation and sleep/delay functionality
- **[� Dynamic Values Cheat Sheet](docs/DYNAMIC_VALUES_CHEAT_SHEET.md)** - Quick reference for placeholders and delays
- **[�🔗 Header Routing Guide](docs/HEADER_ROUTING.md)** - Advanced routing with headers
- **[📁 Examples](examples/)** - Ready-to-use mock configurations and import files

### Quick Links
- [Dynamic Placeholders](docs/DYNAMIC_VALUES_AND_DELAYS.md#-dynamic-value-placeholders) - 60+ placeholder types
- [Response Delays](docs/DYNAMIC_VALUES_AND_DELAYS.md#️-response-delays-sleep) - Simulate network conditions  
- [Complete Examples](docs/DYNAMIC_VALUES_AND_DELAYS.md#-complete-examples) - Real-world use cases
- [Cheat Sheet](docs/DYNAMIC_VALUES_CHEAT_SHEET.md) - Quick reference guide
- [Best Practices](docs/DYNAMIC_VALUES_AND_DELAYS.md#-best-practices) - Tips for effective mocking

---

## ✅ Recent Updates & Improvements

### 🎨 **UI/UX Enhancements**
- [x] **Tailwind CSS v4 Compatibility**: Updated all opacity utilities to new v4 syntax
- [x] **CSS Conflict Resolution**: Fixed conflicting `hidden` and `flex` classes
- [x] **Smart Notifications**: Contextual notifications with auto-dismiss and click-to-close
- [x] **Improved Modal System**: Enhanced modal centering and responsive design

---

## ✅ Completed Features

### 🎯 **Core Functionality** 
- [x] **Complete Mock Management**: Full CRUD operations with validation
- [x] **Header-based Routing**: Advanced request matching with optional headers
- [x] **Mock Analysis**: Conflict detection and duplicate identification
- [x] **Persistent Storage**: File-based mock storage with automatic saving
- [x] **Request Testing**: Built-in mock testing and matching validation
- [x] **Modern UI**: Liquid glass design with responsive layouts

### 🎲 **Dynamic Values & Delays**
- [x] **Dynamic Value Generation**: 60+ Faker.js placeholders ({{name}}, {{email}}, {{uuid}}, etc.)
- [x] **Response Delays**: Fixed, random, and network simulation delays
- [x] **Template System**: Flexible placeholder system for realistic data
- [x] **Preview Functionality**: Test dynamic responses before saving
- [x] **Real-time Generation**: Live dynamic value processing

### 🔄 **Export/Import & Integration**
- [x] **JSON Export/Import**: Complete mock collections with metadata
- [x] **Postman Integration**: Auto-generate Postman collections from saved mocks
- [x] **HTTPie Commands**: Generate corresponding HTTPie test commands
- [x] **File Upload**: Drag-and-drop or file selector import
- [x] **JSON Paste**: Direct JSON import via textarea

### 🎨 **User Experience**
- [x] **Keyboard Shortcuts**: Full keyboard navigation (Ctrl+E, Ctrl+I, Ctrl+P, etc.)
- [x] **Smart Notifications**: Contextual feedback system with auto-dismiss
- [x] **Modal System**: Comprehensive modal-based interfaces
- [x] **Help System**: Built-in help modal with shortcuts and API reference
- [x] **Icon-based Actions**: Clean, intuitive button design with tooltips

### 🛠️ **Developer Experience**
- [x] **Comprehensive Logging**: Detailed request/response logging with noise filtering
- [x] **Error Handling**: Robust error handling with user-friendly messages
- [x] **API Documentation**: Built-in API reference and usage examples
- [x] **Live Preview**: Real-time mock testing and validation

### 🔧 **Technical Excellence**
- [x] **Tailwind CSS v4**: Modern styling with liquid glass theme
- [x] **Modular Architecture**: Clean separation of concerns
- [x] **Intelligent Log Filtering**: Noise reduction from dev tools
- [x] **Global State Management**: Optimized UI state handling
- [x] **Enhanced Security**: Helmet.js and CORS protection

---

## 🚀 Next Priority Features

### 📊 **Analytics & Monitoring**
- [ ] **Usage Dashboard**: Mock hit statistics and analytics
- [ ] **Request History**: Comprehensive request logging with search/filter
- [ ] **Performance Metrics**: Response time tracking and performance insights
- [ ] **Real-time Monitoring**: Live request monitoring with WebSocket updates

### � **Advanced Matching**
- [ ] **Wildcard Paths**: Dynamic path matching (e.g., `/api/user/*/profile`)
- [ ] **Query Parameters**: Query param-based mock resolution
- [ ] **Body Matching**: Request body content-based routing
- [ ] **Regex Support**: Regular expression matching for paths and headers

### 🎲 **Enhanced Dynamic Features**
- [ ] **Custom Scripts**: User-defined JavaScript for advanced response generation
- [ ] **State Management**: Stateful mocks that remember previous requests
- [ ] **Conditional Logic**: If/else logic in dynamic responses
- [ ] **External Data Sources**: Integration with APIs/databases for dynamic content

### 🔧 **Workflow & Collaboration**
- [ ] **Mock Versioning**: Version control for mock collections with diff views
- [ ] **Team Sharing**: Cloud sync and collaboration features
- [ ] **Template Library**: Pre-built mock templates for common scenarios
- [ ] **Bulk Operations**: Mass edit/delete/export operations

---

## 🔮 Future Enhancements

### 🏢 **Enterprise Features**
- [ ] **Multi-environment**: Dev/staging/prod environment management
- [ ] **Database Support**: SQLite and PostgreSQL integration
- [ ] **Authentication**: JWT-based admin panel and mock protection
- [ ] **RBAC**: Role-based access control for team environments

### � **AI & Intelligence**
- [ ] **AI Response Suggestions**: ML-based response generation from real API patterns
- [ ] **OpenAPI Integration**: Swagger/OpenAPI to mock converter with validation
- [ ] **Auto-learning**: Automatically create mocks from real API traffic
- [ ] **Smart Suggestions**: Context-aware placeholder and pattern suggestions

### 🔗 **Integrations & Tools**
- [ ] **CLI Tool**: Command-line interface for mock management and CI/CD
- [ ] **Browser Extension**: Quick mock creation from browser requests
- [ ] **IDE Plugins**: VS Code/IntelliJ plugins for mock management
- [ ] **Docker Support**: Containerized deployment options

### 📱 **Platform Extensions**
- [ ] **Mobile App**: iOS/Android interface for mock management
- [ ] **Desktop App**: Electron-based desktop application
- [ ] **API Gateway**: Mock server as microservice with service discovery
- [ ] **GraphQL Support**: GraphQL mock endpoint generation

---

## 🚀 Technology Stack

- **Backend**: Node.js + Express.js
- **Frontend**: Vanilla JavaScript + Tailwind CSS v4
- **Storage**: File-based JSON storage (future: SQLite/PostgreSQL)
- **Architecture**: RESTful API with modular route handlers
- **UI Framework**: Custom liquid glass design system
- **Build Tools**: Tailwind CSS CLI for optimized styling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for developers who need powerful, beautiful mock servers**

⭐ Star this repo if you find it useful!
