#!/bin/bash

# Dynamic Mock Server - Database Setup Script
# This script helps set up PostgreSQL or MongoDB for the Dynamic Mock Server

set -e

echo "🚀 Dynamic Mock Server - Database Setup"
echo "========================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to setup PostgreSQL
setup_postgres() {
    echo ""
    echo "🐘 Setting up PostgreSQL..."
    
    if command_exists psql; then
        echo "✅ PostgreSQL is already installed"
    else
        echo "❌ PostgreSQL not found. Please install PostgreSQL first:"
        echo ""
        echo "macOS:    brew install postgresql"
        echo "Ubuntu:   sudo apt install postgresql postgresql-contrib"
        echo "Docker:   docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres"
        echo ""
        read -p "Press Enter after installing PostgreSQL..."
    fi
    
    echo ""
    echo "📝 PostgreSQL Database Setup"
    read -p "Enter database name (default: mock_server): " DB_NAME
    DB_NAME=${DB_NAME:-mock_server}
    
    read -p "Enter database user (default: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}
    
    read -s -p "Enter database password: " DB_PASSWORD
    echo ""
    
    read -p "Enter database host (default: localhost): " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    read -p "Enter database port (default: 5432): " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    
    echo ""
    echo "🔧 Creating .env configuration..."
    
    cat >> .env << EOF

# PostgreSQL Configuration
STORAGE_TYPE=postgres
POSTGRES_HOST=$DB_HOST
POSTGRES_PORT=$DB_PORT
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=$DB_NAME

# Alternative: Use connection string instead
# DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
EOF
    
    echo "✅ PostgreSQL configuration added to .env"
    echo ""
    echo "📋 Next steps:"
    echo "1. Ensure PostgreSQL server is running"
    echo "2. Create the database: createdb $DB_NAME"
    echo "3. Start the server: npm start"
}

# Function to setup MongoDB
setup_mongodb() {
    echo ""
    echo "🍃 Setting up MongoDB..."
    
    if command_exists mongod; then
        echo "✅ MongoDB is already installed"
    else
        echo "❌ MongoDB not found. Please install MongoDB first:"
        echo ""
        echo "macOS:    brew install mongodb-community"
        echo "Ubuntu:   sudo apt install mongodb"
        echo "Docker:   docker run --name mongo -p 27017:27017 -d mongo"
        echo ""
        read -p "Press Enter after installing MongoDB..."
    fi
    
    echo ""
    echo "📝 MongoDB Database Setup"
    read -p "Enter database name (default: mock_server): " DB_NAME
    DB_NAME=${DB_NAME:-mock_server}
    
    read -p "Enter database host (default: localhost): " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
    
    read -p "Enter database port (default: 27017): " DB_PORT
    DB_PORT=${DB_PORT:-27017}
    
    echo ""
    echo "🔧 Creating .env configuration..."
    
    cat >> .env << EOF

# MongoDB Configuration
STORAGE_TYPE=mongodb
MONGO_HOST=$DB_HOST
MONGO_PORT=$DB_PORT
MONGO_DB=$DB_NAME

# Alternative: Use connection string instead
# MONGODB_URL=mongodb://$DB_HOST:$DB_PORT/$DB_NAME
EOF
    
    echo "✅ MongoDB configuration added to .env"
    echo ""
    echo "📋 Next steps:"
    echo "1. Ensure MongoDB server is running"
    echo "2. Start the server: npm start"
}

# Main menu
echo ""
echo "Choose storage backend:"
echo "1) PostgreSQL (Recommended for production)"
echo "2) MongoDB (Recommended for document-based storage)"
echo "3) File Storage (Default - no setup needed)"
echo "4) Exit"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        setup_postgres
        ;;
    2)
        setup_mongodb
        ;;
    3)
        echo ""
        echo "✅ File storage selected (default)"
        echo "No additional setup required."
        echo ""
        echo "To start the server: npm start"
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting..."
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📖 For more information, see docs/DATABASE_STORAGE.md"
echo "🚀 To start the server: npm start"
