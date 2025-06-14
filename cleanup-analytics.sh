#!/bin/bash

# Analytics Cleanup Script
# Wrapper for the Node.js cleanup utility

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 Dynamic Mock Server - Analytics Cleanup${NC}"
echo "=============================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed or not in PATH${NC}"
    exit 1
fi

# Check if cleanup script exists
if [ ! -f "cleanup-analytics.js" ]; then
    echo -e "${RED}❌ cleanup-analytics.js not found${NC}"
    echo "Make sure you're running this from the project root directory"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found${NC}"
    echo "Make sure PostgreSQL connection settings are available"
fi

# Show menu if no arguments provided
if [ $# -eq 0 ]; then
    echo ""
    echo "Select cleanup option:"
    echo "1) Clean all tables (keep last 30 days)"
    echo "2) Clean all tables (keep last 7 days)"
    echo "3) Clean request history only (keep last 30 days)"
    echo "4) Reset mock hit counts to 0"
    echo "5) Custom cleanup"
    echo "6) Dry run (show what would be deleted)"
    echo "7) Exit"
    echo ""
    read -p "Enter your choice (1-7): " choice

    case $choice in
        1)
            echo -e "${GREEN}🧹 Cleaning all tables (keep last 30 days)${NC}"
            node cleanup-analytics.js --days=30
            ;;
        2)
            echo -e "${GREEN}🧹 Cleaning all tables (keep last 7 days)${NC}"
            node cleanup-analytics.js --days=7
            ;;
        3)
            echo -e "${GREEN}🧹 Cleaning request history only (keep last 30 days)${NC}"
            node cleanup-analytics.js --table=request_history --days=30
            ;;
        4)
            echo -e "${GREEN}🧹 Resetting mock hit counts${NC}"
            node cleanup-analytics.js --reset-hits
            ;;
        5)
            echo ""
            read -p "Days to keep (default 30): " days
            days=${days:-30}
            
            echo "Select table to clean:"
            echo "1) All tables"
            echo "2) request_history only"
            echo "3) mock_hits only"
            echo "4) daily_stats only"
            read -p "Table choice (1-4): " table_choice
            
            case $table_choice in
                1) table_arg="" ;;
                2) table_arg="--table=request_history" ;;
                3) table_arg="--table=mock_hits" ;;
                4) table_arg="--table=daily_stats" ;;
                *) echo -e "${RED}Invalid choice${NC}"; exit 1 ;;
            esac
            
            read -p "Dry run? (y/N): " dry_run
            dry_run_arg=""
            if [[ $dry_run =~ ^[Yy] ]]; then
                dry_run_arg="--dry-run"
            fi
            
            echo -e "${GREEN}🧹 Running custom cleanup${NC}"
            node cleanup-analytics.js --days=$days $table_arg $dry_run_arg
            ;;
        6)
            echo -e "${GREEN}🧹 Dry run - showing what would be deleted${NC}"
            node cleanup-analytics.js --dry-run --days=30
            ;;
        7)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
else
    # Pass all arguments to the Node.js script
    node cleanup-analytics.js "$@"
fi

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Cleanup completed successfully${NC}"
else
    echo ""
    echo -e "${RED}❌ Cleanup failed with exit code $exit_code${NC}"
fi

exit $exit_code
