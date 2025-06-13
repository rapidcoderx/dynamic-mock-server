# 🌊 Dynamic Mock Server

A sleek, modern mock server with a liquid-glass UI and dynamic API capabilities. Configure and simulate API responses easily for local testing, demos, or prototyping – all with a beautiful frontend and modular backend.

---

## ✨ Features

- 🧱 **Complete Mock Management**:
  - Create mocks with unique names, paths, HTTP methods
  - Optional headers (as JSON) for advanced routing
  - Custom response body (as JSON) with status codes
  - Edit existing mocks with full validation
  - Delete mocks with confirmation dialogs
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
  └── HEADER_ROUTING.md       # Documentation for header-based routing

/examples
  └── header-routing-examples.json  # Example configurations
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

### 3. Build & Development Commands

```bash
# CSS Development (watch mode)
npm run build-css

# CSS Production (minified)
npm run build-css-prod

# Run tests
npm test
```

### 4. Environment Configuration

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

## ✅ Recent Updates & Improvements

### 🎨 **UI/UX Enhancements**
- [x] **Tailwind CSS v4 Compatibility**: Updated all opacity utilities to new v4 syntax
- [x] **CSS Conflict Resolution**: Fixed conflicting `hidden` and `flex` classes
- [x] **Smart Notifications**: Contextual notifications with auto-dismiss and click-to-close
- [x] **Improved Modal System**: Enhanced modal centering and responsive design

### 🔧 **Technical Improvements**
- [x] **Notification System Optimization**: Eliminated redundant "Loaded X mocks" notifications after delete/edit operations
- [x] **Global State Management**: Improved mock list refresh handling for better UX
- [x] **Enhanced Error Handling**: Better error messages and validation feedback
- [x] **Intelligent Log Filtering**: Suppresses noise from dev tools and browser requests (Chrome DevTools, favicon, etc.)
- [x] **Code Architecture**: Modular JavaScript functions for better maintainability

### 🛠️ **Core Features Completed**
- [x] **Complete CRUD Operations**: Create, Read, Update, Delete mocks with full validation
- [x] **Header-based Routing**: Advanced mock matching with optional headers
- [x] **Mock Analysis**: Conflict detection and duplicate identification
- [x] **Persistent Storage**: File-based mock storage with automatic saving
- [x] **Request Testing**: Built-in mock testing and matching validation
- [x] **Modern UI**: Liquid glass design with responsive layouts

---

## 🔮 Roadmap & Future Enhancements

### 📈 **Recently Completed Features**
- [x] 🔗 **Export/Import**: Complete mock collections export/import functionality with JSON format
- [x] 📋 **Postman Integration**: Auto-generate Postman collections from saved mocks with example responses
- [x] 🔧 **HTTPie Commands**: Generate corresponding HTTPie test commands with proper syntax
- [x] ⌨️ **Keyboard Shortcuts**: Full keyboard navigation support (Ctrl+E, Ctrl+I, Ctrl+P, etc.)

### 📊 **Next Priority Features**
- [ ] � **Analytics Dashboard**: Mock usage statistics and hit tracking
- [ ] � **Mock Versioning**: Version control for mock collections
- [ ] � **Advanced Search**: Search mocks by content, headers, and response data

### 🚀 **Advanced Features**
- [ ] ✨ **Wildcard Paths**: Support for dynamic path matching (e.g., `/api/user/*`)
- [ ] 🔍 **Query Parameters**: Query param-based mock resolution
- [ ] ⏱️ **Response Delays**: Configurable response delay simulation
- [ ] 🎲 **Dynamic Values**: Timestamp, UUIDs, and random data generation
- [ ] � **Request Logging**: Comprehensive request history and logging panel

### �️ **Security & Production**
- [ ] 🔐 **Environment Toggles**: Dev/prod configuration for CORS & security
- [ ] 🗄️ **Database Support**: SQLite and PostgreSQL integration
- [ ] 🔑 **Authentication**: JWT-based admin panel and mock protection
- [ ] 🔒 **Encrypted Storage**: Secure mock storage options

### 🧠 **AI & Intelligence**
- [ ] 🤖 **AI Response Suggestions**: Machine learning-based response generation
- [ ] � **OpenAPI Integration**: Swagger/OpenAPI to mock converter
- [ ] 🧰 **CLI Tool**: Command-line interface for mock management
- [ ] � **Mobile App**: Mobile interface for mock management

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
