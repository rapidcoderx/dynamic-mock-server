# 🌊 Dynamic Mock Server

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Features](https://img.shields.io/badge/Features-Dynamic%20Values%20%26%20Delays-blue)
![UI](https://img.shields.io/badge/UI-Liquid%20Glass%20Theme-purple)
![Integration](https://img.shields.io/badge/Export-JSON%20%7C%20Postman%20%7C%20HTTPie-orange)
![Storage](https://img.shields.io/badge/Storage-File%20%7C%20PostgreSQL%20%7C%20MongoDB-green)

A sleek, modern mock server with a liquid-glass UI and dynamic API capabilities. Configure and simulate API responses easily for local testing, demos, or prototyping – all with a beautiful frontend and modular backend.

## 🏆 Key Achievements

**🎯 Production-Ready**: Complete CRUD operations, persistent storage, and robust error handling  
**🔍 Advanced Search & Pagination**: Real-time search with debouncing and smart pagination for handling large mock datasets  
**🎲 Dynamic & Intelligent**: 60+ Faker.js placeholders with realistic response delays  
**🔍 Advanced Matching**: Query parameter and header-based routing with 7 match types  
**�️ Multi-Storage Support**: File, PostgreSQL, and MongoDB backends with automatic migration  
**📊 Analytics Dashboard**: Comprehensive usage tracking, request history, and performance metrics  
**�🔄 Integration-Friendly**: Export to JSON, Postman collections, and HTTPie commands  
**📡 API Collections**: Ready-to-use Postman, HTTPie Desktop, and CLI collections  
**🎨 Modern UX**: Liquid glass UI with keyboard shortcuts and smart notifications  
**📚 Well-Documented**: Comprehensive guides, examples, and API reference  

> *Ready for real-world use with enterprise-grade features and developer-focused design*

---

A sleek, modern mock server with a liquid-glass UI and dynamic API capabilities. Configure and simulate API responses easily for local testing, demos, or prototyping – all with a beautiful frontend and modular backend.

## ✨ Features

- 🧱 **Complete Mock Management**:
  - Create mocks with unique names, paths, HTTP methods
  - Optional headers (as JSON) for advanced routing
  - Query parameter matching with multiple conditions (equals, contains, starts_with, ends_with, regex, exists, not_exists)
  - Custom response body (as JSON) with status codes
  - Edit existing mocks with full validation
  - Delete mocks with confirmation dialogs
  - **Advanced Search & Pagination**: Real-time search across mock names, paths, methods, and IDs
  - **Intelligent Filtering**: Debounced search with instant results and clear functionality
  - **Flexible Pagination**: Configurable page sizes (10, 25, 50, 100) with smart navigation
  - **State Preservation**: Search and pagination context maintained during CRUD operations
- 🎲 **Dynamic Values & Response Delays**:
  - Dynamic value generation using Faker.js (names, emails, timestamps, UUIDs, etc.)
  - Template placeholders for realistic data ({{name}}, {{email}}, {{timestamp}})
  - Response delays (fixed, random, network simulation)
  - Preview functionality for testing dynamic responses
  - 60+ built-in placeholder types across multiple categories
- �️ **Multi-Storage Backend**:
  - **File Storage**: JSON-based persistence (default)
  - **PostgreSQL**: Enterprise SQL database with automatic schema management
  - **MongoDB**: NoSQL document database with indexing
  - Configurable via environment variables with automatic fallback
  - Graceful migration between storage types
- 📡 **API Collections & Integration**:
  - **Postman Collection**: Complete collection with test scripts and examples
  - **HTTPie Desktop**: Native collection for HTTPie Desktop GUI
  - **HTTPie CLI**: Shell script with all commands and advanced examples
  - **Interactive Demo**: Automated demo script showcasing all features
  - Export/Import functionality for backup and migration
- 👁️ **Rich UI Experience**: 
  - Modal-based mock viewer with **search and pagination capabilities**
  - **Real-time Search**: Instant filtering with debounced input and clear button
  - **Smart Pagination**: Configurable page sizes with Previous/Next navigation
  - **Live Updates**: Search and pagination state preserved during mock operations
  - **Loading Indicators**: Visual feedback during search operations
  - Smart notification system with contextual feedback
  - Responsive liquid glass theme using Tailwind CSS v4
  - Keyboard shortcuts and intuitive navigation
- 📊 **Analytics Dashboard & Insights**:
  - **Usage Dashboard**: Visual display of mock hit statistics and trends
  - **Request History**: Complete log of API requests with filtering capabilities
  - **Performance Metrics**: Response time tracking and distribution analysis
  - **Mock Hit Statistics**: Track which mocks are used most frequently
  - **Status Code Analysis**: Monitor success/error rates across all requests
  - **Daily Trends**: Historical view of usage patterns over time
  - **Data Export**: Download analytics data in various formats
  - **Persistent Storage**: PostgreSQL integration for long-term analytics data
  - **Smart Filtering**: Exclude UI and system calls for clean analytics data
- 🔌 **Dynamic Configuration & Health**: 
  - Config-driven `apiPrefix` support
  - Health checks with storage backend status
  - Environment-based configuration with .env support
  - Graceful shutdown and error handling
- 🛠️ **Developer Experience**: 
  - Comprehensive logging and request matching validation
  - Real-time mock conflict detection and analysis
  - Advanced request analysis and testing endpoints
  - Complete documentation with examples and guides
- 🧩 **Modular Architecture**: Clean separation with `routes/`, `utils/`, and storage strategies

---

## 🛠️ Project Structure

```
/server
  ├── index.js                # Entry point with Express server & async storage init
  ├── logger.js               # Centralized logging system
  ├── security.js             # Security middleware
  ├── tracer.js               # Request tracing utilities
  ├── swagger.js              # API documentation generation
  ├── middleware/             
  │   └── analytics.js        # Analytics tracking and reporting middleware
  └── routes/
      ├── mockRoutes.js       # Mock CRUD operations & export/import
      └── analyticsRoutes.js  # Analytics API endpoints and dashboard data

/tests
  └── scripts/                # Test scripts and utilities
      ├── test-*.js           # JavaScript test files
      ├── test-*.sh           # Bash test scripts
      ├── cleanup-*.js        # Analytics cleanup utilities
      └── cleanup-*.sh        # Database maintenance shell scripts

/utils
  ├── matcher.js              # Advanced mock matching logic
  ├── storage.js              # File-based storage implementation
  ├── storageStrategy.js      # Storage backend selector & initialization
  ├── postgresStorage.js      # PostgreSQL storage backend with analytics tables
  ├── mongoStorage.js         # MongoDB storage backend
  └── dynamicResponse.js      # Dynamic value processing engine

/public
  ├── index.html              # Modern liquid glass frontend
  ├── styles.css              # Compiled Tailwind CSS
  ├── favicon.svg             # App favicon
  └── icon.svg                # App icon

/src
  └── styles.css              # Source Tailwind CSS with custom components

/mocks
  └── mock-config.json        # Persistent mock storage (file mode)

/docs
  ├── README.md               # Main documentation
  ├── HEADER_ROUTING.md       # Header-based routing docs
  ├── QUERY_PARAMETER_ROUTING.md # Query param routing docs
  ├── DYNAMIC_VALUES_AND_DELAYS.md # Dynamic mocks guide
  ├── DYNAMIC_VALUES_CHEAT_SHEET.md # Quick reference for placeholders and delays
  ├── DATABASE_STORAGE.md     # Database storage setup & configuration guide
  ├── ANALYTICS_IMPLEMENTATION.md # Analytics dashboard implementation details
  ├── ANALYTICS_FILTERING.md  # Analytics request filtering documentation
  ├── ANALYTICS_CLEANUP.md    # Analytics database cleanup utilities
  └── POSTGRESQL_ANALYTICS_SOLUTION.md # PostgreSQL analytics integration guide

/api-collections
  ├── README.md               # API collections documentation
  ├── Dynamic-Mock-Server.postman_collection.json    # Postman collection
  ├── Dynamic-Mock-Server.httpie-desktop.json        # HTTPie Desktop collection
  ├── httpie-commands.sh      # HTTPie CLI commands
  └── demo.sh                 # Interactive demo script

/examples
  ├── header-routing-examples.json  # Example configurations
  ├── query-parameter-examples.json # Query parameter matching examples
  └── dynamic-values-examples.json  # Dynamic values and delay examples

/sql
  └── emergency-analytics-cleanup.sql # Emergency analytics cleanup SQL script

/scripts
  └── setup-database.sh       # Interactive database setup script

/.env.example                 # Environment configuration template
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

### 2. Storage Configuration (Optional)

**File Storage (Default)**:
```bash
# No configuration needed
npm start
```

**Database Setup (Interactive)**:
```bash
# Run interactive setup script
npm run setup-db
# Follow the prompts to configure PostgreSQL or MongoDB
```

**Manual Database Configuration**:
```bash
# Copy example configuration
cp .env.example .env
# Edit .env with your database settings
```

**PostgreSQL Storage**:
```bash
# Set environment variables in .env
STORAGE_TYPE=postgres
DATABASE_URL=postgresql://user:pass@localhost:5432/mock_server

npm start
```

**MongoDB Storage**:
```bash
# Set environment variables  
STORAGE_TYPE=mongodb
MONGODB_URL=mongodb://localhost:27017/mock_server

npm start
```

See **[📄 Database Storage Guide](docs/DATABASE_STORAGE.md)** for detailed setup instructions.

### 3. Access App

Open: [http://localhost:8080](http://localhost:8080)

### 4. API Collections (Optional)

For programmatic access and testing, use the provided API collections:

**Postman Collection**:
- Import `api-collections/Dynamic-Mock-Server.postman_collection.json` into Postman
- Pre-configured with environment variables and test scripts
- Organized folders for all CRUD operations

**HTTPie Commands**:
- Use `api-collections/httpie-commands.sh` for command-line testing
- Ready-to-run commands with examples
- Advanced usage patterns and one-liners

```bash
# Example HTTPie usage
http GET localhost:3000/api/v1/mocks  # List all mocks
http POST localhost:3000/api/v1/mocks name="Test API" method="GET" path="/test" response:='{"message": "Hello"}'
```

See **[📡 API Collections](api-collections/)** for complete documentation.

### 5. Quick Start with Dynamic Values

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

### 6. Build & Development Commands

```bash
# Development
npm run dev                  # Start with nodemon (auto-restart)
npm start                    # Production start

# Setup & Validation
npm run setup-db             # Interactive database setup script
npm run validate              # Validate server configuration and setup
./scripts/setup-database.sh  # Direct script execution

# CSS Build
npm run build-css            # CSS Development (watch mode)
npm run build-css-prod       # CSS Production (minified)

# Testing & Maintenance
npm test                     # Run tests
npm run ncu                  # Update dependencies with npm-check-updates
```

### 7. Environment Configuration

Create a `.env` file (or copy from `.env.example`) to configure the server:

```bash
# Server Configuration
PORT=8080                    # Server port (default: 8080)
API_PREFIX=/api              # API prefix for mock endpoints (default: /api)
LOG_DEV_REQUESTS=false       # Show filtered dev tool requests in logs (default: false)

# Storage Configuration
STORAGE_TYPE=file            # Storage backend: file, postgres, mongodb (default: file)

# PostgreSQL Configuration (when STORAGE_TYPE=postgres)
DATABASE_URL=postgresql://user:password@localhost:5432/mock_server
# OR individual components:
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=mock_user
POSTGRES_PASSWORD=mock_password
POSTGRES_DATABASE=mock_server

# MongoDB Configuration (when STORAGE_TYPE=mongodb)
MONGODB_URL=mongodb://localhost:27017/mock_server
# OR individual components:
MONGODB_HOST=localhost
MONGODB_PORT=27017
MONGODB_DATABASE=mock_server
MONGODB_USERNAME=mock_user    # Optional
MONGODB_PASSWORD=mock_password # Optional
```

**Storage Backend Selection:**
- **File Storage** (default): No additional setup required
- **PostgreSQL**: Set `STORAGE_TYPE=postgres` and provide database connection details
- **MongoDB**: Set `STORAGE_TYPE=mongodb` and provide database connection details

The server automatically creates necessary tables/collections and handles graceful fallback to file storage if database connection fails.

---

## 🔍 Query Parameter Matching

The Dynamic Mock Server supports advanced query parameter matching to create more precise mock responses based on request parameters.

### Query Parameter Match Types

| Match Type | Description | Example |
|------------|-------------|---------|
| `equals` | Exact value match | `?status=active` matches only "active" |
| `contains` | Value contains substring | `?name=john` matches "john", "johnny", "johnson" |
| `starts_with` | Value starts with substring | `?code=US` matches "USA", "USD", "US123" |
| `ends_with` | Value ends with substring | `?file=.pdf` matches "report.pdf", "data.pdf" |
| `regex` | Regular expression match | `?id=\d+` matches any numeric ID |
| `exists` | Parameter must be present | `?debug` matches any request with debug param |
| `not_exists` | Parameter must not be present | Matches requests without the parameter |

### Required vs Optional Parameters

- **Required**: Mock will only match if the parameter condition is met
- **Optional**: Mock will match regardless, but if present, the condition must be met

### Query Parameter Examples

**Example 1: API Version Routing**
```json
{
  "name": "API v2 Users",
  "method": "GET",
  "path": "/api/users",
  "queryParams": [
    {
      "key": "version",
      "type": "equals",
      "value": "2",
      "required": true
    }
  ],
  "response": {"version": "2.0", "users": [...]}
}
```

**Example 2: Search with Filters**
```json
{
  "name": "User Search with Filters",
  "method": "GET", 
  "path": "/api/users",
  "queryParams": [
    {
      "key": "search",
      "type": "contains",
      "value": "john",
      "required": false
    },
    {
      "key": "active",
      "type": "equals", 
      "value": "true",
      "required": true
    }
  ],
  "response": {"results": [...], "total": 5}
}
```

**Example 3: Debug Mode Detection**
```json
{
  "name": "Debug Response",
  "method": "GET",
  "path": "/api/status",
  "queryParams": [
    {
      "key": "debug",
      "type": "exists",
      "required": true
    }
  ],
  "response": {"debug": true, "memory": "512MB", "uptime": "2h"}
}
```

### Creating Query Parameter Mocks

**Via UI:**
1. Click "➕ Add Mock" to open the form
2. Fill in basic details (name, method, path)
3. In the "Query Parameters" section, click "➕ Add Parameter"
4. Configure each parameter:
   - **Parameter name**: The query parameter key
   - **Match type**: Select from dropdown (equals, contains, etc.)
   - **Expected value**: The value to match against (not needed for exists/not_exists)
   - **Required/Optional**: Whether the parameter is mandatory

**Via API:**
```bash
curl -X POST http://localhost:8080/api/mocks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Filtered Results",
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
    "response": {"products": [...]}
  }'
```

---

## 🧪 Testing Mocks

### ✅ Via UI
- **Create**: Add new mocks via the intuitive form interface
- **View**: Browse all mocks in a powerful modal with **advanced search and pagination**:
  - **Real-time Search**: Filter mocks by name, path, method, or ID as you type
  - **Smart Pagination**: Navigate through pages with configurable page sizes (10, 25, 50, 100)
  - **Instant Clear**: Use the ✕ button or ESC key to quickly clear search
  - **Live Updates**: Search and pagination state preserved during mock operations
  - **Performance Optimized**: Debounced search for smooth typing experience
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

### 🎲 Dynamic Values & Response Delays

#### Enabling Dynamic Value Generation

When creating or editing a mock, you can control whether dynamic value processing is enabled:

1. **Enable Dynamic Values Checkbox**: 
   - Located in "⚙️ Advanced Options" section
   - **Checked (✓)**: Placeholders like `{{name}}`, `{{email}}`, `{{uuid}}` will be replaced with real values
   - **Unchecked (☐)**: Placeholders will be returned as-is in the response

2. **Behavior Examples**:

   **With Dynamic Values ENABLED** (checkbox checked):
   ```json
   // Your template: {"user": "{{name}}", "id": "{{uuid}}"}
   // Response: {"user": "Alice Johnson", "id": "a1b2c3d4-e5f6-7890"}
   ```

   **With Dynamic Values DISABLED** (checkbox unchecked):
   ```json
   // Your template: {"user": "{{name}}", "id": "{{uuid}}"}
   // Response: {"user": "{{name}}", "id": "{{uuid}}"}
   ```

3. **When to Use Each Mode**:
   - **Enable**: For realistic testing with varied data
   - **Disable**: When you need exact template responses or are debugging placeholder syntax

4. **Available Placeholders**: 60+ options including:
   - `{{name}}`, `{{email}}`, `{{phone}}` - Person data
   - `{{uuid}}`, `{{timestamp}}`, `{{number:1:100}}` - IDs & numbers
   - `{{oneOf:success,error,pending}}` - Random selection
   - `{{arrayOf:3:word}}` - Arrays of generated values

Click "📋 Show Placeholders" in the UI to see the complete list with examples.

#### Response Delays

Configure realistic network delays in Advanced Options:
- **Fixed**: Consistent delay (e.g., 500ms)
- **Random**: Variable delay within range (e.g., 200-800ms)
- **Network**: Simulates real network conditions

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
- `ESC`: Close any open modal or clear search in mock viewer
- **Search & Navigation** (in mock viewer):
  - `ESC`: Clear search and return to full mock list
  - Click `✕`: Clear search with mouse

---

## 📚 Documentation

- **[🎲 Dynamic Values & Response Delays Guide](docs/DYNAMIC_VALUES_AND_DELAYS.md)** - Complete guide to dynamic value generation and sleep/delay functionality
- **[📋 Dynamic Values Cheat Sheet](docs/DYNAMIC_VALUES_CHEAT_SHEET.md)** - Quick reference for placeholders and delays
- **[🔗 Header Routing Guide](docs/HEADER_ROUTING.md)** - Advanced routing with headers
- **[🗄️ Database Storage Guide](docs/DATABASE_STORAGE.md)** - PostgreSQL and MongoDB setup instructions
- **[📡 API Collections](api-collections/)** - Postman collection and HTTPie commands for all API operations
- **[📁 Examples](examples/)** - Ready-to-use mock configurations and import files

### Quick Links
- [Dynamic Placeholders](docs/DYNAMIC_VALUES_AND_DELAYS.md#-dynamic-value-placeholders) - 60+ placeholder types
- [Response Delays](docs/DYNAMIC_VALUES_AND_DELAYS.md#️-response-delays-sleep) - Simulate network conditions  
- [Complete Examples](docs/DYNAMIC_VALUES_AND_DELAYS.md#-complete-examples) - Real-world use cases
- [Cheat Sheet](docs/DYNAMIC_VALUES_CHEAT_SHEET.md) - Quick reference guide
- [Best Practices](docs/DYNAMIC_VALUES_AND_DELAYS.md#-best-practices) - Tips for effective mocking

---

## ✅ Recent Updates & Improvements

### 🗄️ **Database Storage Integration** (Latest)
- [x] **Multi-Backend Support**: Added PostgreSQL and MongoDB storage options
- [x] **Environment Configuration**: Complete .env setup with automatic fallback
- [x] **Schema Management**: Automatic table/collection creation and indexing
- [x] **Migration Support**: Seamless switching between storage backends
- [x] **Health Monitoring**: Database connection status in health endpoints
- [x] **Interactive Setup**: Automated database setup script with validation

### 📡 **API Collections & Integration** (Latest)
- [x] **Postman Collection**: Complete collection with test scripts and examples
- [x] **HTTPie Desktop**: Native collection for HTTPie Desktop GUI
- [x] **HTTPie CLI Commands**: Comprehensive shell script with advanced examples
- [x] **Interactive Demo**: Automated demo script showcasing all features
- [x] **Export/Import**: Advanced backup and migration functionality

### 🎨 **UI/UX Enhancements**
- [x] **Tailwind CSS v4 Compatibility**: Updated all opacity utilities to new v4 syntax
- [x] **CSS Conflict Resolution**: Fixed conflicting `hidden` and `flex` classes
- [x] **Smart Notifications**: Contextual notifications with auto-dismiss and click-to-close
- [x] **Improved Modal System**: Enhanced modal centering and responsive design

---

## ✅ Completed Features

### 🎯 **Core Functionality** 
- [x] **Complete Mock Management**: Full CRUD operations with validation
- [x] **Advanced Search & Pagination**: Real-time search with debouncing, smart pagination, and state preservation
- [x] **Intelligent Filtering**: Search across mock names, paths, methods, and IDs with instant clear functionality
- [x] **Flexible Pagination**: Configurable page sizes (10, 25, 50, 100) with Previous/Next navigation
- [x] **Header-based Routing**: Advanced request matching with optional headers
- [x] **Query Parameter Matching**: 7 match types (equals, contains, starts_with, ends_with, regex, exists, not_exists)
- [x] **Mock Analysis**: Conflict detection and duplicate identification
- [x] **Multi-Storage Support**: File, PostgreSQL, and MongoDB storage backends
- [x] **Request Testing**: Built-in mock testing and matching validation
- [x] **Modern UI**: Liquid glass design with responsive layouts

### 🗄️ **Storage & Persistence**
- [x] **File Storage**: JSON file-based storage (default)
- [x] **PostgreSQL Storage**: Traditional SQL database with ACID compliance
- [x] **MongoDB Storage**: NoSQL document database with flexible schema
- [x] **Auto-Fallback**: Graceful fallback to file storage on database errors
- [x] **Connection Pooling**: Efficient database connection management
- [x] **Graceful Shutdown**: Proper cleanup of database connections

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
- [x] **HTTPie Desktop**: Native HTTPie Desktop collection format
- [x] **Interactive Demo**: Comprehensive demo script with all operations
- [x] **File Upload**: Drag-and-drop or file selector import
- [x] **JSON Paste**: Direct JSON import via textarea

### 📡 **API Collections**
- [x] **Postman Collection**: Complete v2.1 collection with test scripts and examples
- [x] **HTTPie Desktop Collection**: Native format for HTTPie Desktop GUI
- [x] **HTTPie CLI Commands**: Shell script with 50+ command examples
- [x] **Query Parameter Examples**: Comprehensive examples for all 7 match types
- [x] **Demo Script**: Interactive demonstration of all features
- [x] **Environment Variables**: Pre-configured variables for all collections
- [x] **Documentation**: Comprehensive usage guides and troubleshooting

### 🎨 **User Experience**
- [x] **Advanced Search Interface**: Real-time search with debounced input and instant clear functionality
- [x] **Smart Pagination**: Configurable page sizes with Previous/Next navigation and live count updates
- [x] **State Preservation**: Search and pagination context maintained during mock CRUD operations
- [x] **Loading Indicators**: Visual feedback during search operations ("Searching..." status)
- [x] **Keyboard Shortcuts**: Full keyboard navigation (Ctrl+E, Ctrl+I, Ctrl+P, ESC to clear search, etc.)
- [x] **Smart Notifications**: Contextual feedback system with auto-dismiss
- [x] **Modal System**: Comprehensive modal-based interfaces
- [x] **Help System**: Built-in help modal with shortcuts and API reference
- [x] **Icon-based Actions**: Clean, intuitive button design with tooltips

### 🛠️ **Developer Experience**
- [x] **Comprehensive Logging**: Detailed request/response logging with noise filtering
- [x] **Error Handling**: Robust error handling with user-friendly messages
- [x] **API Documentation**: Built-in API reference and usage examples
- [x] **Query Parameter Documentation**: Complete guide with examples and best practices
- [x] **Live Preview**: Real-time mock testing and validation

### 🔧 **Technical Excellence**
- [x] **Tailwind CSS v4**: Modern styling with liquid glass theme
- [x] **Modular Architecture**: Clean separation of concerns
- [x] **Intelligent Log Filtering**: Noise reduction from dev tools
- [x] **Global State Management**: Optimized UI state handling
- [x] **Enhanced Security**: Helmet.js and CORS protection

---

## 🚀 Next Priority Features

### 📊 **Analytics & Monitoring** ✓
- [x] **Usage Dashboard**: Visual display of mock hit statistics and trends ✓
- [x] **Request History**: Complete log of API requests with filtering capabilities ✓
- [x] **Performance Metrics**: Response time tracking and distribution analysis ✓
- [x] **Mock Hit Statistics**: Track which mocks are used most frequently
- [x] **Status Code Analysis**: Monitor success/error rates across all requests
- [x] **Daily Trends**: Historical view of usage patterns over time
- [ ] **Data Export**: Download analytics data in various formats
- [ ] **Persistent Storage**: PostgreSQL integration for long-term analytics data
- [ ] **Smart Filtering**: Exclude UI and system calls for clean analytics data
- [ ] **Real-time Monitoring**: Live request monitoring with WebSocket updates

### 🔍 **Advanced Matching**
- [ ] **Wildcard Paths**: Dynamic path matching (e.g., `/api/user/*/profile`)
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

## 🏢 **Enterprise Features**
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
