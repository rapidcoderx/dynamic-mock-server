# 🗄️ Database Storage Configuration

The Dynamic Mock Server supports multiple storage backends for production deployments and enhanced persistence.

## 📋 Supported Storage Types

### 🗂️ **File Storage (Default)**
- **Type**: `file`
- **Best for**: Development, testing, small datasets
- **Persistence**: JSON file (`mocks/mock-config.json`)
- **Setup**: No configuration required

### 🐘 **PostgreSQL Storage**
- **Type**: `postgres` or `postgresql`
- **Best for**: Production, ACID compliance, complex queries
- **Features**: Transactions, indexing, full SQL support
- **Setup**: Requires PostgreSQL database

### 🍃 **MongoDB Storage**
- **Type**: `mongodb` or `mongo`
- **Best for**: Document-based storage, horizontal scaling
- **Features**: Flexible schema, JSON-native storage
- **Setup**: Requires MongoDB database

---

## ⚙️ Configuration

### Environment Variables

Set the storage type in your `.env` file:

```bash
# Choose storage backend
STORAGE_TYPE=file          # Default: file-based storage
# STORAGE_TYPE=postgres    # PostgreSQL database
# STORAGE_TYPE=mongodb     # MongoDB database
```

### PostgreSQL Configuration

#### Option 1: Connection String
```bash
STORAGE_TYPE=postgres
DATABASE_URL=postgresql://username:password@host:port/database_name
```

#### Option 2: Individual Parameters
```bash
STORAGE_TYPE=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=mock_server
```

### MongoDB Configuration

#### Option 1: Connection String
```bash
STORAGE_TYPE=mongodb
MONGODB_URL=mongodb://localhost:27017/mock_server
```

#### Option 2: Individual Parameters
```bash
STORAGE_TYPE=mongodb
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DB=mock_server
```

#### With Authentication
```bash
STORAGE_TYPE=mongodb
MONGODB_URL=mongodb://username:password@host:port/database_name
```

---

## 🔧 Database Setup

### PostgreSQL Setup

1. **Install PostgreSQL**:
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Docker
   docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
   ```

2. **Create Database**:
   ```sql
   CREATE DATABASE mock_server;
   CREATE USER mock_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE mock_server TO mock_user;
   ```

3. **Configure Environment**:
   ```bash
   STORAGE_TYPE=postgres
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=mock_user
   POSTGRES_PASSWORD=your_password
   POSTGRES_DB=mock_server
   ```

4. **Start Server**:
   The server will automatically create the required tables and indexes.

### MongoDB Setup

1. **Install MongoDB**:
   ```bash
   # macOS
   brew install mongodb-community
   brew services start mongodb-community
   
   # Ubuntu/Debian
   sudo apt install mongodb
   sudo systemctl start mongod
   
   # Docker
   docker run --name mongo -p 27017:27017 -d mongo
   ```

2. **Configure Environment**:
   ```bash
   STORAGE_TYPE=mongodb
   MONGO_HOST=localhost
   MONGO_PORT=27017
   MONGO_DB=mock_server
   ```

3. **Start Server**:
   The server will automatically create the required collections and indexes.

---

## 🏗️ Database Schemas

### PostgreSQL Schema

```sql
CREATE TABLE mocks (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    path TEXT NOT NULL,
    headers JSONB DEFAULT '{}',
    response JSONB NOT NULL,
    status_code INTEGER DEFAULT 200,
    delay JSONB DEFAULT NULL,
    dynamic BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_mocks_method_path ON mocks(method, path);
CREATE INDEX idx_mocks_headers ON mocks USING GIN(headers);
```

### MongoDB Schema

```javascript
{
  id: String,           // Unique mock identifier
  name: String,         // Mock name
  method: String,       // HTTP method (GET, POST, etc.)
  path: String,         // API path
  headers: Object,      // Request headers matcher
  response: Object,     // Mock response
  statusCode: Number,   // HTTP status code
  delay: Object,        // Response delay configuration
  dynamic: Boolean,     // Enable dynamic value generation
  createdAt: Date,      // Creation timestamp
  updatedAt: Date       // Last update timestamp
}
```

---

## 🔄 Migration & Data Import/Export

### Switching Storage Types

1. **Export from Current Storage**:
   - Use the UI "⬆️ Export" button to download mocks as JSON
   - Or use API: `GET /api/mocks/export`

2. **Update Configuration**:
   ```bash
   # Change storage type
   STORAGE_TYPE=postgres  # or mongodb
   # Add database connection details
   ```

3. **Import to New Storage**:
   - Use the UI "⬇️ Import" button to upload the JSON file
   - Or use API: `POST /api/mocks/import`

### Backup Strategies

#### PostgreSQL Backup
```bash
# Backup
pg_dump mock_server > mock_server_backup.sql

# Restore
psql mock_server < mock_server_backup.sql
```

#### MongoDB Backup
```bash
# Backup
mongodump --db mock_server --out ./backup

# Restore
mongorestore --db mock_server ./backup/mock_server
```

---

## 🚀 Production Deployment

### Docker Compose Example

```yaml
version: '3.8'
services:
  mock-server:
    build: .
    ports:
      - "8080:8080"
    environment:
      - STORAGE_TYPE=postgres
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/mock_server
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=mock_server
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Environment-Specific Configuration

#### Development
```bash
STORAGE_TYPE=file
```

#### Staging
```bash
STORAGE_TYPE=postgres
DATABASE_URL=postgresql://user:pass@staging-db:5432/mock_server_staging
```

#### Production
```bash
STORAGE_TYPE=postgres
DATABASE_URL=postgresql://user:pass@prod-db:5432/mock_server_prod
NODE_ENV=production
```

---

## 🔍 Monitoring & Health Checks

The health check endpoint provides storage information:

```bash
curl http://localhost:8080/api/health
```

Response:
```json
{
  "status": "ok",
  "storage": {
    "type": "postgres",
    "current": "postgres"
  },
  "mocks": 15,
  "timestamp": "2025-06-13T19:30:00.000Z"
}
```

---

## ⚠️ Troubleshooting

### Common Issues

1. **Connection Refused**:
   - Verify database is running
   - Check connection parameters
   - Ensure firewall allows connections

2. **Authentication Failed**:
   - Verify username/password
   - Check user permissions
   - Ensure database exists

3. **Fallback to File Storage**:
   - Server automatically falls back to file storage if database fails
   - Check logs for specific error messages

### Error Recovery

The server includes automatic fallback mechanisms:
- If database connection fails, it falls back to file storage
- Graceful shutdown ensures proper connection cleanup
- Failed operations are logged with specific error details

### Debug Logging

Enable debug logging for storage operations:
```bash
LOG_LEVEL=debug
LOG_DEV_REQUESTS=true
```
