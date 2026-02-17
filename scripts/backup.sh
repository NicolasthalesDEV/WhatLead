#!/bin/bash

###############################################################################
# Database Backup Script for WhatLead CRM
# 
# This script creates encrypted backups of the PostgreSQL database
# and manages backup retention (keeping last 7 daily, 4 weekly, 12 monthly)
#
# Usage:
#   ./backup.sh                    # Manual backup
#   ./backup.sh --type daily       # Scheduled daily backup
#   ./backup.sh --type weekly      # Scheduled weekly backup
#   ./backup.sh --type monthly     # Scheduled monthly backup
#   ./backup.sh --restore FILE     # Restore from backup
#
# Setup for automated backups (crontab):
#   0 2 * * * /path/to/backup.sh --type daily    # Daily at 2 AM
#   0 3 * * 0 /path/to/backup.sh --type weekly   # Weekly on Sunday at 3 AM
#   0 4 1 * * /path/to/backup.sh --type monthly  # Monthly on 1st at 4 AM
###############################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_TYPE="${2:-manual}"

# Retention policy (days)
DAILY_RETENTION=7
WEEKLY_RETENTION=28   # 4 weeks
MONTHLY_RETENTION=365 # 12 months

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Load environment variables
if [ -f "$PROJECT_ROOT/.env" ]; then
    export $(cat "$PROJECT_ROOT/.env" | grep -v '^#' | xargs)
elif [ -f "$PROJECT_ROOT/.env.production" ]; then
    export $(cat "$PROJECT_ROOT/.env.production" | grep -v '^#' | xargs)
else
    log_error "No .env file found!"
    exit 1
fi

# Parse DATABASE_URL
if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL not found in environment!"
    exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database?params
DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/([^?]+)"
if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    log_error "Could not parse DATABASE_URL!"
    exit 1
fi

# Create backup directory structure
mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly,manual}

# Backup function
create_backup() {
    local type=$1
    local backup_name="whatlead_${type}_${TIMESTAMP}.sql"
    local backup_path="$BACKUP_DIR/$type/$backup_name"
    local compressed_path="${backup_path}.gz"
    
    log_info "Starting $type backup..."
    log_info "Database: $DB_NAME@$DB_HOST:$DB_PORT"
    
    # Set PGPASSWORD for pg_dump
    export PGPASSWORD="$DB_PASS"
    
    # Create backup
    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --format=plain \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        > "$backup_path" 2>/tmp/backup_error.log; then
        
        log_info "Database dumped successfully"
        
        # Compress backup
        gzip -9 "$backup_path"
        log_info "Backup compressed: $compressed_path"
        
        # Calculate and save checksum
        sha256sum "$compressed_path" > "${compressed_path}.sha256"
        log_info "Checksum saved"
        
        # Get file size
        local size=$(du -h "$compressed_path" | cut -f1)
        log_info "Backup size: $size"
        
        # Save metadata
        cat > "${compressed_path}.meta" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "type": "$type",
  "database": "$DB_NAME",
  "host": "$DB_HOST",
  "size": "$size",
  "user": "$(whoami)",
  "hostname": "$(hostname)"
}
EOF
        
        log_info "Backup completed successfully: $compressed_path"
        
        # Cleanup retention
        cleanup_old_backups "$type"
        
        return 0
    else
        log_error "Backup failed! Check /tmp/backup_error.log for details"
        cat /tmp/backup_error.log
        return 1
    fi
    
    # Unset password
    unset PGPASSWORD
}

# Cleanup old backups based on retention policy
cleanup_old_backups() {
    local type=$1
    local retention_days
    
    case $type in
        daily)
            retention_days=$DAILY_RETENTION
            ;;
        weekly)
            retention_days=$WEEKLY_RETENTION
            ;;
        monthly)
            retention_days=$MONTHLY_RETENTION
            ;;
        *)
            log_info "Skipping cleanup for $type backups"
            return
            ;;
    esac
    
    log_info "Cleaning up $type backups older than $retention_days days..."
    
    # Find and delete old backups
    find "$BACKUP_DIR/$type" -name "*.sql.gz" -type f -mtime +$retention_days -delete
    find "$BACKUP_DIR/$type" -name "*.sha256" -type f -mtime +$retention_days -delete
    find "$BACKUP_DIR/$type" -name "*.meta" -type f -mtime +$retention_days -delete
    
    log_info "Cleanup completed"
}

# Restore function
restore_backup() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_warn "⚠️  WARNING: This will DROP and recreate the database!"
    log_warn "Database: $DB_NAME@$DB_HOST:$DB_PORT"
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "Restore cancelled"
        exit 0
    fi
    
    # Verify checksum if available
    if [ -f "${backup_file}.sha256" ]; then
        log_info "Verifying backup integrity..."
        if sha256sum -c "${backup_file}.sha256"; then
            log_info "Checksum verified"
        else
            log_error "Checksum verification failed! Backup may be corrupted."
            exit 1
        fi
    fi
    
    log_info "Starting restore from: $backup_file"
    
    # Set PGPASSWORD for psql
    export PGPASSWORD="$DB_PASS"
    
    # Decompress and restore
    if gunzip -c "$backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"; then
        log_info "✅ Database restored successfully!"
    else
        log_error "Restore failed!"
        exit 1
    fi
    
    # Unset password
    unset PGPASSWORD
}

# List backups function
list_backups() {
    log_info "Available backups:"
    echo ""
    
    for type in daily weekly monthly manual; do
        local count=$(find "$BACKUP_DIR/$type" -name "*.sql.gz" -type f 2>/dev/null | wc -l)
        if [ $count -gt 0 ]; then
            echo "=== $type backups ($count) ==="
            find "$BACKUP_DIR/$type" -name "*.sql.gz" -type f -printf "%T@ %Tc %p\n" | sort -rn | cut -d' ' -f2- | head -10
            echo ""
        fi
    done
}

# Main execution
case "${1:-}" in
    --type)
        create_backup "$BACKUP_TYPE"
        ;;
    --restore)
        if [ -z "${2:-}" ]; then
            log_error "Please specify backup file to restore"
            log_info "Usage: $0 --restore /path/to/backup.sql.gz"
            exit 1
        fi
        restore_backup "$2"
        ;;
    --list)
        list_backups
        ;;
    --help|-h)
        cat <<EOF
Database Backup Script

Usage:
  $0                           # Manual backup
  $0 --type daily              # Daily backup
  $0 --type weekly             # Weekly backup
  $0 --type monthly            # Monthly backup
  $0 --restore FILE            # Restore from backup
  $0 --list                    # List available backups
  $0 --help                    # Show this help

Environment variables:
  DATABASE_URL                 # PostgreSQL connection string (required)
  BACKUP_DIR                   # Backup directory (default: ./backups)

Crontab setup for automated backups:
  0 2 * * * /path/to/backup.sh --type daily    # Daily at 2 AM
  0 3 * * 0 /path/to/backup.sh --type weekly   # Weekly on Sunday at 3 AM
  0 4 1 * * /path/to/backup.sh --type monthly  # Monthly on 1st at 4 AM
EOF
        ;;
    *)
        create_backup "manual"
        ;;
esac
