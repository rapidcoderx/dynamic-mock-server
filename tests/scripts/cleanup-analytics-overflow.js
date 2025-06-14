#!/usr/bin/env node

/**
 * Emergency analytics cleanup script for numeric overflow issues
 * Run this if you're experiencing "numeric field overflow" errors
 */

// Load environment variables from .env file
try {
  require('dotenv').config();
  console.log('✅ Loaded environment variables from .env file');
} catch (err) {
  console.log('⚠️ Could not load dotenv, will try to continue with system environment variables');
  console.log('   If you need to use a .env file, run: npm install dotenv --save');
}

const { getStorageInstance } = require('../../utils/storageStrategy');
const PostgresStorage = require('../../utils/postgresStorage');

async function checkCurrentStorage() {
    console.log('� Checking current storage configuration...');
    
    const storageType = process.env.STORAGE_TYPE || 'file';
    const useDb = process.env.USE_DB === 'true';
    
    console.log(`📦 STORAGE_TYPE: ${storageType}`);
    console.log(`🗄️  USE_DB: ${useDb}`);
    
    // Check for PostgreSQL environment variables
    const pgVars = {
        DATABASE_URL: process.env.DATABASE_URL,
        POSTGRES_HOST: process.env.POSTGRES_HOST,
        POSTGRES_PORT: process.env.POSTGRES_PORT,
        POSTGRES_USER: process.env.POSTGRES_USER,
        POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD ? '***SET***' : undefined,
        POSTGRES_DB: process.env.POSTGRES_DB
    };
    
    console.log('🐘 PostgreSQL configuration:');
    Object.entries(pgVars).forEach(([key, value]) => {
        if (value !== undefined) {
            console.log(`   ${key}: ${value}`);
        }
    });
    
    return { storageType, useDb, hasPostgresConfig: Object.values(pgVars).some(v => v !== undefined) };
}

async function tryPostgresCleanup() {
    console.log('🐘 Attempting PostgreSQL cleanup...');
    
    try {
        const storage = new PostgresStorage();
        await storage.initialize();
        console.log('✅ PostgreSQL connection successful');
        
        // First, apply schema updates directly to handle the overflow issue
        console.log('🔧 Updating database schema to prevent future overflows...');
        const { Pool } = require('pg');
        
        // Get connection details from PostgresStorage instance or environment
        const config = {
            connectionString: process.env.DATABASE_URL || 
                `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'password'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'mock_server'}`,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        };
        
        const pool = new Pool(config);
        const client = await pool.connect();
        
        try {
            // Execute critical DDL updates from emergency SQL
            console.log('🔄 Converting INTEGER columns to BIGINT to prevent overflow...');
            
            // Check if columns are of type INTEGER
            const columnCheck = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'daily_stats' 
                AND column_name = 'total_requests'
            `);
            
            if (columnCheck.rows.length > 0 && columnCheck.rows[0].data_type === 'integer') {
                // Apply schema updates
                await client.query(`ALTER TABLE daily_stats ALTER COLUMN total_requests TYPE BIGINT;`);
                await client.query(`ALTER TABLE daily_stats ALTER COLUMN mock_hits TYPE BIGINT;`);
                await client.query(`ALTER TABLE daily_stats ALTER COLUMN not_found_requests TYPE BIGINT;`);
                console.log('✅ Schema updated: INTEGER columns converted to BIGINT');
            } else {
                console.log('✅ Schema already updated (columns are already BIGINT)');
            }
            
            // Create archived daily stats table if it doesn't exist
            await client.query(`
                CREATE TABLE IF NOT EXISTS archived_daily_stats (
                    id SERIAL PRIMARY KEY,
                    year INTEGER NOT NULL,
                    month INTEGER NOT NULL,
                    total_requests BIGINT DEFAULT 0,
                    mock_hits BIGINT DEFAULT 0,
                    not_found_requests BIGINT DEFAULT 0,
                    average_response_time DECIMAL(10,2) DEFAULT 0,
                    status_codes JSONB DEFAULT '{}',
                    archived_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(year, month)
                );
            `);
            console.log('✅ Created archived_daily_stats table if needed');
            
        } catch (sqlError) {
            console.error('❌ Schema update error:', sqlError.message);
            // Continue with cleanup even if schema update fails
        } finally {
            client.release();
        }
        
        // Clean up old analytics data (keep only last 30 days)
        console.log('🧹 Cleaning up old analytics data (keeping last 30 days)...');
        await storage.cleanupAnalytics(30);
        console.log('✅ Old analytics data cleaned up');
        
        // Reset today's stats if they're overflowed
        const today = new Date().toISOString().split('T')[0];
        console.log(`🔄 Resetting today's daily stats (${today}) to prevent overflow...`);
        await storage.resetDailyStatsForDate(today);
        console.log('✅ Today\'s stats reset');
        
        // Archive old data
        console.log('📦 Archiving old analytics data...');
        if (typeof storage.archiveOldAnalytics === 'function') {
            await storage.archiveOldAnalytics(90); // Archive data older than 90 days
            console.log('✅ Old analytics data archived');
        } else {
            console.log('⚠️ Storage doesn\'t support archiving, skipping this step');
        }
        
        return true;
        
    } catch (error) {
        console.log(`❌ PostgreSQL cleanup failed: ${error.message}`);
        return false;
    }
}

async function executeEmergencySql() {
    console.log('🔧 Attempting direct SQL execution of sql/emergency-analytics-cleanup.sql...');
    
    const fs = require('fs');
    const path = require('path');
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    try {
        // Check if SQL file exists
        const sqlFilePath = path.join(__dirname, '../../sql/emergency-analytics-cleanup.sql');
        if (!fs.existsSync(sqlFilePath)) {
            console.error('❌ SQL file not found:', sqlFilePath);
            return false;
        }
        
        // Build the PostgreSQL connection string
        const dbUrl = process.env.DATABASE_URL;
        const host = process.env.POSTGRES_HOST || 'localhost';
        const port = process.env.POSTGRES_PORT || 5432;
        const user = process.env.POSTGRES_USER || 'postgres';
        const password = process.env.POSTGRES_PASSWORD;
        const dbName = process.env.POSTGRES_DB || 'mock_server';
        
        let psqlCommand;
        if (dbUrl) {
            // Use connection URL if provided
            psqlCommand = `PGPASSWORD="${password}" psql "${dbUrl}" -f "${sqlFilePath}"`;
        } else {
            // Otherwise build connection from individual components
            psqlCommand = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -d ${dbName} -f "${sqlFilePath}"`;
        }
        
        console.log('🔄 Executing SQL commands...');
        const { stdout, stderr } = await execPromise(psqlCommand);
        
        if (stderr && !stderr.includes('NOTICE')) {
            console.warn('⚠️  SQL execution warnings:', stderr);
        }
        
        console.log('✅ SQL execution complete:', stdout);
        return true;
        
    } catch (error) {
        console.error('❌ SQL execution failed:', error.message);
        console.log('💡 You might need to run SQL commands manually:');
        console.log('   psql -U your_user -d your_db -f sql/emergency-analytics-cleanup.sql');
        return false;
    }
}

async function emergencyCleanup() {
    console.log('🚨 Starting emergency analytics cleanup...');
    
    try {
        const config = await checkCurrentStorage();
        
        if (config.storageType === 'file' && !config.useDb) {
            console.log('📁 File-based storage detected - no database cleanup needed');
            console.log('💡 The overflow error might be from a previous PostgreSQL setup');
            console.log('✅ Current file-based storage should not have overflow issues');
            return;
        }
        
        if (!config.hasPostgresConfig) {
            console.log('⚠️  No PostgreSQL configuration found');
            console.log('💡 If you\'re getting overflow errors, you might need to:');
            console.log('   1. Set up PostgreSQL environment variables, or');
            console.log('   2. Use the sql/emergency-analytics-cleanup.sql file to run SQL commands directly');
            console.log('   3. Switch to file-based storage by removing STORAGE_TYPE env var');
            
            // Try direct SQL execution as a last resort
            console.log('\n🔄 Attempting direct SQL execution as a last resort...');
            const sqlSuccess = await executeEmergencySql();
            if (sqlSuccess) {
                console.log('🎉 SQL cleanup completed successfully!');
                process.exit(0);
            }
            return;
        }
        
        // Try PostgreSQL cleanup via the API
        const success = await tryPostgresCleanup();
        
        if (success) {
            console.log('🎉 Emergency cleanup completed successfully!');
            console.log('📊 Your analytics should now work without overflow errors.');
            console.log('💡 Consider running this cleanup script periodically to prevent future overflows.');
            process.exit(0);
        } else {
            console.log('❌ Automated cleanup via API failed');
            console.log('📝 Trying direct SQL execution as fallback...');
            
            // Try direct SQL execution
            const sqlSuccess = await executeEmergencySql();
            
            if (sqlSuccess) {
                console.log('🎉 SQL cleanup completed successfully!');
                process.exit(0);
            } else {
                console.log('❌ Both API and SQL cleanup methods failed');
                console.log('📝 Manual options:');
                console.log('   1. Check your PostgreSQL credentials and connection settings');
                console.log('   2. Connect to your PostgreSQL database and run the SQL manually');
                console.log('   3. Switch to file-based storage temporarily');
                process.exit(1);
            }
        }
        
    } catch (error) {
        console.error('❌ Emergency cleanup failed:', error.message);
        console.log('\n🔍 Troubleshooting tips:');
        console.log('1. Make sure PostgreSQL is running and accessible');
        console.log('2. Check your database connection environment variables:');
        console.log('   - DATABASE_URL or POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB');
        console.log('3. Try running the SQL commands manually using sql/emergency-analytics-cleanup.sql');
        console.log('4. Consider switching to file storage: unset STORAGE_TYPE and USE_DB');
        
        // As a last resort, try direct SQL execution
        console.log('\n🔄 Attempting direct SQL execution as a last resort...');
        const sqlSuccess = await executeEmergencySql();
        if (sqlSuccess) {
            console.log('🎉 SQL cleanup completed successfully despite earlier errors!');
            process.exit(0);
        } else {
            process.exit(1);
        }
    }
}

// Run the cleanup
emergencyCleanup();
