#!/usr/bin/env node

/**
 * Analytics Cleanup Utility
 * 
 * This utility cleans up analytics data from PostgreSQL tables:
 * - request_history: Remove old request logs
 * - mock_hits: Reset hit counts or remove old entries
 * - daily_stats: Remove old daily statistics
 * 
 * Usage:
 *   node cleanup-analytics.js [options]
 *   
 * Options:
 *   --days=N          Keep data from last N days (default: 30)
 *   --dry-run         Show what would be deleted without actually deleting
 *   --table=TABLE     Clean only specific table (request_history, mock_hits, daily_stats)
 *   --reset-hits      Reset mock hit counts to 0 instead of deleting
 *   --help            Show this help message
 */

const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Configuration
const config = {
    connectionString: process.env.DATABASE_URL || 
        `postgresql://${process.env.POSTGRES_USER || 'postgres'}:${process.env.POSTGRES_PASSWORD || 'password'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'dynamic_mock_server'}`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    days: 30,
    dryRun: false,
    table: null,
    resetHits: false,
    help: false
};

args.forEach(arg => {
    if (arg.startsWith('--days=')) {
        options.days = parseInt(arg.split('=')[1]) || 30;
    } else if (arg === '--dry-run') {
        options.dryRun = true;
    } else if (arg.startsWith('--table=')) {
        options.table = arg.split('=')[1];
    } else if (arg === '--reset-hits') {
        options.resetHits = true;
    } else if (arg === '--help') {
        options.help = true;
    }
});

// Show help
if (options.help) {
    console.log(`
Analytics Cleanup Utility

This utility cleans up analytics data from PostgreSQL tables:
- request_history: Remove old request logs
- mock_hits: Reset hit counts or remove old entries  
- daily_stats: Remove old daily statistics

Usage:
  node cleanup-analytics.js [options]
  
Options:
  --days=N          Keep data from last N days (default: 30)
  --dry-run         Show what would be deleted without actually deleting
  --table=TABLE     Clean only specific table (request_history, mock_hits, daily_stats)
  --reset-hits      Reset mock hit counts to 0 instead of deleting
  --help            Show this help message

Examples:
  node cleanup-analytics.js --days=7
  node cleanup-analytics.js --dry-run --days=14
  node cleanup-analytics.js --table=request_history --days=30
  node cleanup-analytics.js --reset-hits --dry-run
`);
    process.exit(0);
}

// Validate table option
const validTables = ['request_history', 'mock_hits', 'daily_stats'];
if (options.table && !validTables.includes(options.table)) {
    console.error(`❌ Invalid table: ${options.table}`);
    console.error(`Valid tables: ${validTables.join(', ')}`);
    process.exit(1);
}

// Main cleanup function
async function cleanupAnalytics() {
    const pool = new Pool(config);
    
    try {
        console.log('🧹 Analytics Cleanup Utility');
        console.log('============================');
        console.log(`📅 Keeping data from last ${options.days} days`);
        console.log(`🔧 Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE EXECUTION'}`);
        if (options.table) {
            console.log(`🎯 Target table: ${options.table}`);
        }
        console.log('');

        // Test connection
        const client = await pool.connect();
        console.log('✅ Connected to PostgreSQL');
        client.release();

        // Calculate cutoff date
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - options.days);
        console.log(`📅 Cutoff date: ${cutoffDate.toISOString().split('T')[0]}`);
        console.log('');

        const results = {
            request_history: 0,
            mock_hits: 0,
            daily_stats: 0
        };

        // Clean request_history table
        if (!options.table || options.table === 'request_history') {
            results.request_history = await cleanRequestHistory(pool, cutoffDate, options.dryRun);
        }

        // Clean mock_hits table
        if (!options.table || options.table === 'mock_hits') {
            results.mock_hits = await cleanMockHits(pool, cutoffDate, options.dryRun, options.resetHits);
        }

        // Clean daily_stats table
        if (!options.table || options.table === 'daily_stats') {
            results.daily_stats = await cleanDailyStats(pool, cutoffDate, options.dryRun);
        }

        // Summary
        console.log('');
        console.log('📊 Cleanup Summary:');
        console.log('==================');
        console.log(`Request History: ${results.request_history} records ${options.dryRun ? 'would be' : ''} removed`);
        console.log(`Mock Hits: ${results.mock_hits} records ${options.dryRun ? 'would be' : ''} ${options.resetHits ? 'reset' : 'removed'}`);
        console.log(`Daily Stats: ${results.daily_stats} records ${options.dryRun ? 'would be' : ''} removed`);
        
        if (options.dryRun) {
            console.log('');
            console.log('💡 This was a dry run. No data was actually deleted.');
            console.log('   Remove --dry-run flag to perform actual cleanup.');
        }

    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Clean request_history table
async function cleanRequestHistory(pool, cutoffDate, dryRun) {
    console.log('🗂️  Cleaning request_history table...');
    
    try {
        // Count records to be deleted
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM request_history WHERE created_at < $1',
            [cutoffDate]
        );
        const count = parseInt(countResult.rows[0].count);
        
        console.log(`   Found ${count} old request history records`);
        
        if (count > 0 && !dryRun) {
            const deleteResult = await pool.query(
                'DELETE FROM request_history WHERE created_at < $1',
                [cutoffDate]
            );
            console.log(`   ✅ Deleted ${deleteResult.rowCount} request history records`);
        }
        
        return count;
    } catch (error) {
        console.error(`   ❌ Error cleaning request_history: ${error.message}`);
        return 0;
    }
}

// Clean mock_hits table
async function cleanMockHits(pool, cutoffDate, dryRun, resetHits) {
    console.log('🎯 Cleaning mock_hits table...');
    
    try {
        if (resetHits) {
            // Reset hit counts instead of deleting
            const countResult = await pool.query(
                'SELECT COUNT(*) FROM mock_hits WHERE hit_count > 0'
            );
            const count = parseInt(countResult.rows[0].count);
            
            console.log(`   Found ${count} mock records with hit counts > 0`);
            
            if (count > 0 && !dryRun) {
                await pool.query('UPDATE mock_hits SET hit_count = 0, updated_at = CURRENT_TIMESTAMP');
                console.log(`   ✅ Reset hit counts for ${count} mock records`);
            }
            
            return count;
        } else {
            // Delete old records
            const countResult = await pool.query(
                'SELECT COUNT(*) FROM mock_hits WHERE updated_at < $1',
                [cutoffDate]
            );
            const count = parseInt(countResult.rows[0].count);
            
            console.log(`   Found ${count} old mock hit records`);
            
            if (count > 0 && !dryRun) {
                const deleteResult = await pool.query(
                    'DELETE FROM mock_hits WHERE updated_at < $1',
                    [cutoffDate]
                );
                console.log(`   ✅ Deleted ${deleteResult.rowCount} mock hit records`);
            }
            
            return count;
        }
    } catch (error) {
        console.error(`   ❌ Error cleaning mock_hits: ${error.message}`);
        return 0;
    }
}

// Clean daily_stats table
async function cleanDailyStats(pool, cutoffDate, dryRun) {
    console.log('📈 Cleaning daily_stats table...');
    
    try {
        // Count records to be deleted
        const countResult = await pool.query(
            'SELECT COUNT(*) FROM daily_stats WHERE date < $1',
            [cutoffDate.toISOString().split('T')[0]]
        );
        const count = parseInt(countResult.rows[0].count);
        
        console.log(`   Found ${count} old daily stats records`);
        
        if (count > 0 && !dryRun) {
            const deleteResult = await pool.query(
                'DELETE FROM daily_stats WHERE date < $1',
                [cutoffDate.toISOString().split('T')[0]]
            );
            console.log(`   ✅ Deleted ${deleteResult.rowCount} daily stats records`);
        }
        
        return count;
    } catch (error) {
        console.error(`   ❌ Error cleaning daily_stats: ${error.message}`);
        return 0;
    }
}

// Run the cleanup
if (require.main === module) {
    cleanupAnalytics().catch(error => {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    });
}

module.exports = { cleanupAnalytics };
