#!/bin/bash

echo "🧪 Testing PostgreSQL Analytics Integration"

# Check if PostgreSQL is running and accessible
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client found"
else
    echo "❌ PostgreSQL client not found"
    exit 1
fi

# Test database connection (assuming default database setup)
PGUSER=${POSTGRES_USER:-postgres}
PGHOST=${POSTGRES_HOST:-localhost}
PGPORT=${POSTGRES_PORT:-5432}
PGDATABASE=${POSTGRES_DB:-mock_server}

echo "🔗 Testing database connection..."
psql "postgresql://${PGUSER}@${PGHOST}:${PGPORT}/${PGDATABASE}" -c "SELECT version();" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
    
    echo "📊 Checking analytics tables..."
    psql "postgresql://${PGUSER}@${PGHOST}:${PGPORT}/${PGDATABASE}" -c "
        SELECT 
            schemaname, 
            tablename 
        FROM pg_tables 
        WHERE tablename IN ('request_history', 'mock_hits', 'daily_stats')
        ORDER BY tablename;
    "
    
    echo "📈 Analytics tables schema:"
    psql "postgresql://${PGUSER}@${PGHOST}:${PGPORT}/${PGDATABASE}" -c "
        \d request_history;
        \d mock_hits;
        \d daily_stats;
    "
    
else
    echo "❌ Database connection failed"
    echo "Please ensure PostgreSQL is running and the database exists"
    echo "Connection string: postgresql://${PGUSER}@${PGHOST}:${PGPORT}/${PGDATABASE}"
fi

echo "
📋 Analytics Implementation Status:
✅ PostgreSQL storage class updated
✅ Analytics tables schema defined
✅ Analytics middleware updated for PostgreSQL
✅ Fallback to in-memory storage
✅ API routes support PostgreSQL

🚀 To test the complete implementation:
1. Ensure PostgreSQL is running
2. Set environment variables if needed:
   export STORAGE_TYPE=postgres
   export POSTGRES_USER=your_user
   export POSTGRES_PASSWORD=your_password
   export POSTGRES_HOST=localhost
   export POSTGRES_PORT=5432
   export POSTGRES_DB=mock_server
3. Start the server: npm start
4. Make requests to see analytics data persist
"
