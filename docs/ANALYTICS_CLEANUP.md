# Analytics Cleanup Utility

This utility helps you clean up analytics data from the PostgreSQL database to maintain performance and manage storage space.

## Overview

The cleanup utility can clean three types of analytics data:

- **`request_history`** - Individual request logs with detailed information
- **`mock_hits`** - Mock endpoint hit counts and statistics  
- **`daily_stats`** - Daily aggregated statistics

## Usage

### Interactive Mode (Recommended)

```bash
./tests/scripts/cleanup-analytics.sh
```

This will show a menu with common cleanup options:

1. **Clean all tables (keep last 30 days)** - Standard cleanup
2. **Clean all tables (keep last 7 days)** - Aggressive cleanup  
3. **Clean request history only** - Keep stats, clean detailed logs
4. **Reset mock hit counts to 0** - Reset counters without deleting
5. **Custom cleanup** - Configure your own options
6. **Dry run** - See what would be deleted without actually deleting
7. **Exit**

### Command Line Usage

```bash
# Clean all tables, keep last 30 days
./tests/scripts/cleanup-analytics.sh --days=30

# Dry run to see what would be deleted
./tests/scripts/cleanup-analytics.sh --dry-run --days=7

# Clean only request history
./tests/scripts/cleanup-analytics.sh --table=request_history --days=14

# Reset mock hit counts instead of deleting
./tests/scripts/cleanup-analytics.sh --reset-hits

# Direct Node.js usage
node ./tests/scripts/cleanup-analytics.js --days=30 --dry-run
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `--days=N` | Keep data from last N days | 30 |
| `--dry-run` | Show what would be deleted without deleting | false |
| `--table=TABLE` | Clean only specific table | all tables |
| `--reset-hits` | Reset hit counts instead of deleting | false |
| `--help` | Show help message | - |

### Valid Table Names

- `request_history` - Individual request logs
- `mock_hits` - Mock endpoint hit statistics
- `daily_stats` - Daily aggregated data

## Examples

### Basic Cleanup (30 days retention)
```bash
./cleanup-analytics.sh --days=30
```

### Aggressive Cleanup (7 days retention)
```bash
./cleanup-analytics.sh --days=7
```

### Clean Only Request History
```bash
./cleanup-analytics.sh --table=request_history --days=14
```

### Reset Mock Hit Counts
```bash
./cleanup-analytics.sh --reset-hits
```

### Dry Run Before Actual Cleanup
```bash
# First, see what would be deleted
./cleanup-analytics.sh --dry-run --days=30

# Then run actual cleanup
./cleanup-analytics.sh --days=30
```

## Automation

### Cron Job Setup

To automatically clean up analytics data daily:

```bash
# Edit crontab
crontab -e

# Add this line to run cleanup daily at 2 AM (keeping 30 days)
0 2 * * * cd /path/to/dynamic-mock-server && ./cleanup-analytics.sh --days=30 >> /var/log/mock-server-cleanup.log 2>&1
```

### Weekly Cleanup (More Conservative)
```bash
# Run weekly on Sunday at 3 AM
0 3 * * 0 cd /path/to/dynamic-mock-server && ./cleanup-analytics.sh --days=90 >> /var/log/mock-server-cleanup.log 2>&1
```

## Database Impact

### Performance Benefits
- Reduces table sizes for faster queries
- Improves index performance
- Reduces backup/restore times
- Frees up storage space

### Retention Recommendations

| Use Case | Recommended Retention | Reason |
|----------|----------------------|--------|
| **Development** | 7-14 days | Fast iteration, less historical data needed |
| **Testing** | 14-30 days | Need some history for debugging |
| **Production** | 30-90 days | Balance between history and performance |
| **Compliance** | 90+ days | May need longer retention for auditing |

### What Gets Cleaned

#### Request History (`request_history`)
- Individual API request logs
- Request/response details
- Performance metrics per request
- **High volume** - Can grow quickly

#### Mock Hits (`mock_hits`)
- Hit counts per mock endpoint
- Last access timestamps
- **Moderate volume** - Usually manageable

#### Daily Stats (`daily_stats`)
- Aggregated daily metrics
- Summary statistics
- **Low volume** - One record per day

## Safety Features

### Dry Run Mode
Always test with `--dry-run` first to see what would be deleted:

```bash
./cleanup-analytics.sh --dry-run --days=30
```

### Backup Before Cleanup
For important production data, consider backing up before cleanup:

```bash
# Backup analytics tables
pg_dump -h localhost -U postgres -d dynamic_mock_server \
  -t request_history -t mock_hits -t daily_stats \
  > analytics_backup_$(date +%Y%m%d).sql

# Then run cleanup
./cleanup-analytics.sh --days=30
```

### Gradual Cleanup
For very large datasets, consider gradual cleanup:

```bash
# Start conservative, then get more aggressive
./cleanup-analytics.sh --days=90 --dry-run
./cleanup-analytics.sh --days=90
./cleanup-analytics.sh --days=60
./cleanup-analytics.sh --days=30
```

## Troubleshooting

### Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify database exists
psql -h localhost -U postgres -l | grep dynamic_mock_server

# Test connection with environment variables
psql "$DATABASE_URL"
```

### Permission Issues
```bash
# Ensure script is executable
chmod +x cleanup-analytics.sh

# Check Node.js is available
node --version
```

### Large Dataset Cleanup
For very large datasets (millions of records), the cleanup might take time:

```bash
# Monitor progress
./cleanup-analytics.sh --days=30 | tee cleanup.log

# Check database size before/after
psql -d dynamic_mock_server -c "
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE tablename IN ('request_history', 'mock_hits', 'daily_stats')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"
```

## Integration with Application

The cleanup utility is designed to run independently of the main application:

- ✅ Can run while the app is running
- ✅ Uses the same database connection settings
- ✅ Safe concurrent operation with the app
- ✅ No app restart required

This makes it perfect for scheduled maintenance without downtime.
