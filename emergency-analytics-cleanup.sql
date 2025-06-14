-- Emergency SQL cleanup for analytics overflow
-- Run these commands directly in your PostgreSQL database if the Node.js script fails

-- First, let's see current stats to understand the overflow
SELECT 
    date, 
    total_requests, 
    mock_hits, 
    not_found_requests, 
    response_times_sum
FROM daily_stats 
ORDER BY date DESC 
LIMIT 10;

-- Check for potential overflow values (close to INTEGER max: 2,147,483,647)
SELECT 
    date,
    total_requests,
    CASE 
        WHEN total_requests > 2000000000 THEN 'OVERFLOW RISK'
        WHEN total_requests > 1000000000 THEN 'HIGH'
        ELSE 'OK'
    END as risk_level
FROM daily_stats 
WHERE total_requests > 1000000000
ORDER BY total_requests DESC;

-- STEP 1: Upgrade table schema to use BIGINT (run this first)
ALTER TABLE daily_stats ALTER COLUMN total_requests TYPE BIGINT;
ALTER TABLE daily_stats ALTER COLUMN mock_hits TYPE BIGINT;
ALTER TABLE daily_stats ALTER COLUMN not_found_requests TYPE BIGINT;

-- STEP 2: Clean up old data (keep only last 30 days)
DELETE FROM request_history 
WHERE timestamp < (CURRENT_DATE - INTERVAL '30 days');

DELETE FROM daily_stats 
WHERE date < (CURRENT_DATE - INTERVAL '30 days');

-- STEP 3: Reset today's stats if they're overflowed
UPDATE daily_stats SET
    total_requests = 0,
    mock_hits = 0,
    not_found_requests = 0,
    average_response_time = 0,
    response_times_sum = 0,
    status_codes = '{}',
    top_paths = '{}',
    top_mocks = '{}',
    updated_at = CURRENT_TIMESTAMP
WHERE date = CURRENT_DATE;

-- STEP 4: Create archived table for future cleanup
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

-- STEP 5: Verify the cleanup worked
SELECT 
    'daily_stats' as table_name,
    COUNT(*) as row_count,
    MAX(total_requests) as max_requests,
    MIN(date) as oldest_date,
    MAX(date) as newest_date
FROM daily_stats
UNION ALL
SELECT 
    'request_history' as table_name,
    COUNT(*) as row_count,
    NULL as max_requests,
    MIN(timestamp::date) as oldest_date,
    MAX(timestamp::date) as newest_date
FROM request_history;

-- Show current table structure to confirm BIGINT upgrade
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'daily_stats' 
    AND column_name IN ('total_requests', 'mock_hits', 'not_found_requests')
ORDER BY column_name;
