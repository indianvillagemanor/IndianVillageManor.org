# Operations Guide

Day-to-day operations, maintenance, and administration procedures for Indian Village Manor.

## Data Locations

| Path | Description |
|------|-------------|
| `/data/documents/` | Committee documents organized by committee ID |
| `/data/documents/<id>/.trash/` | Soft-deleted documents awaiting permanent deletion |
| `/data/logs/audit.log` | Audit log file (JSON-lines format) |
| `/data/backups/` | Backup archive files |
| PostgreSQL | User accounts, roles, committees, events, audit records, config, templates |

## Backup and Recovery

### Manual Backup

```bash
./scripts/backup/backup.sh
```

Options:
- Set `BACKUP_DIR` environment variable to customize backup location (default: `/data/backups`)
- Set `BACKUP_ENCRYPTION_KEY` to enable AES-256-CBC encryption
- Set `BACKUP_RETENTION_DAYS` to control retention (default: 30)

The backup includes:
1. PostgreSQL database dump (pg_dump custom format)
2. Documents directory (`/data/documents`)
3. Log files (`/data/logs`)

### Automated Backups

Install the provided crontab for daily 2:00 AM backups:

```bash
# Review the crontab
cat scripts/backup/crontab.example

# Install (edit paths as needed)
crontab -e
# Add: 0 2 * * * /opt/ivm/scripts/backup/backup.sh >> /data/logs/backup.log 2>&1
```

### Restore from Backup

```bash
./scripts/backup/restore.sh /data/backups/ivm_backup_20260217_020000.tar.gz
```

The restore script will:
1. Decrypt the archive if encrypted (prompts for key)
2. Show backup contents
3. Prompt before overwriting the database
4. Restore PostgreSQL data
5. Restore document files
6. Restore log files

### Verify Backups

Periodically test backup integrity:

```bash
# List backup contents without extracting
tar -tzf /data/backups/ivm_backup_*.tar.gz

# Test restore on a separate database
pg_restore --list /path/to/db_backup.dump
```

## User Administration

### Common Tasks via Admin Console

Log in as a dbadmin user and navigate to **Admin Console** (`/admin/console`):

- **Users** - View all users, search by name/email, filter by status, edit roles
- **Bulk Operations** - Assign roles or committee membership to multiple users
- **System Config** - Edit rate limits, session timeouts, upload limits, alert thresholds
- **Email Templates** - Edit magic link, approval, denial, and notification email templates
- **Audit Logs** - Search, filter, and export audit trail

### User Verification

Verifier-role users can approve or deny pending registrations at `/admin/verify`.

### Direct Database Access

For operations not available through the UI:

```bash
# Development
npx prisma studio

# Production (via Docker)
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U ivm_user -d ivm_db
```

Common queries:

```sql
-- List all users with their roles
SELECT u.email, u."verificationStatus", array_agg(r.name) as roles
FROM "User" u
LEFT JOIN "_RoleToUser" ru ON u.id = ru."B"
LEFT JOIN "Role" r ON r.id = ru."A"
GROUP BY u.id, u.email, u."verificationStatus";

-- Count pending verifications
SELECT COUNT(*) FROM "User" WHERE "verificationStatus" = 'pending';

-- Recent audit log entries
SELECT action, "userName", "createdAt"
FROM "AuditLog"
ORDER BY "createdAt" DESC
LIMIT 20;
```

## System Configuration

System configuration is stored in the `SystemConfig` table and editable via Admin Console > Config.

| Key | Default | Description |
|-----|---------|-------------|
| `site_title` | Indian Village Manor | Site display name |
| `max_login_attempts` | 5 | Login attempts before lockout |
| `login_cooldown_minutes` | 15 | Cooldown after max login attempts |
| `session_max_age_days` | 90 | Session expiration |
| `max_upload_size_mb` | 25 | Maximum file upload size |
| `audit_log_retention_days` | 365 | Authenticated user log retention |
| `anonymous_log_retention_days` | 90 | Anonymous visitor log retention |
| `email_rate_limit_per_hour` | 20 | Email sending rate limit |

## Audit Log Management

### Viewing Logs

- **UI**: Admin Console > Audit Logs (`/admin/console/audit-logs`)
- **File**: `/data/logs/audit.log` (JSON-lines format)
- **Database**: `AuditLog` table

### Log Cleanup

Cleanup removes old entries based on retention settings:

1. Via UI: Admin Console > Audit Logs > "Cleanup Old Logs" button
2. Via API: `POST /api/admin/audit-logs` (dbadmin auth required)

### CSV Export

Export filtered audit logs from the Audit Logs page. Click "Export CSV" to download (limited to 10,000 entries per export).

### Log Format

Each line in `audit.log` is a JSON object:

```json
{
  "timestamp": "2026-02-17T15:30:00.000Z",
  "action": "login_success",
  "actor": "John Doe (Unit: 101)",
  "userId": "abc123",
  "entityType": "session",
  "success": true,
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 ..."
}
```

## Monitoring

### Health Checks

```bash
# Application health (checks database connectivity)
curl http://localhost:3000/api/health
# Returns: {"status":"ok","timestamp":"...","database":"connected"}

# Nginx health
curl http://localhost/nginx-health
```

### Container Health

```bash
# All container statuses
docker compose -f docker-compose.prod.yml ps

# Resource usage
docker stats
```

### Disk Usage

```bash
# Check data directories
du -sh /data/documents /data/logs /data/backups

# Check Docker volumes
docker system df -v
```

### Database Monitoring

```bash
# Connection count
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U ivm_user -d ivm_db -c "SELECT count(*) FROM pg_stat_activity;"

# Database size
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U ivm_user -d ivm_db -c "SELECT pg_size_pretty(pg_database_size('ivm_db'));"

# Table sizes
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U ivm_user -d ivm_db -c "
    SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
    FROM pg_catalog.pg_statio_user_tables
    ORDER BY pg_total_relation_size(relid) DESC;"
```

## Email System

### Email Templates

Templates are stored in the `EmailTemplate` database table and editable via Admin Console > Email Templates:

| Template | Purpose |
|----------|---------|
| `magic-link` | Login magic link emails |
| `approval` | User verified notification |
| `denial` | User denied notification |
| `verifier-notification` | New registration alert to verifiers |
| `profile-update-reverify` | Re-verification triggered notification |
| `welcome` | Welcome email for new users |

Templates support variables like `{{firstName}}`, `{{loginUrl}}`, etc. Available variables are shown as chips in the template editor.

### Email Troubleshooting

```bash
# Check email configuration
echo $EMAIL_SERVER
echo $EMAIL_FROM

# Check logs for email errors
grep -i "email" /data/logs/audit.log | tail -20

# Test SMTP connectivity (from host)
openssl s_client -connect smtp.gmail.com:465
```

## Security Operations

### Failed Login Monitoring

Check for brute-force attempts:

```bash
# Recent failed logins
grep "login_failed" /data/logs/audit.log | tail -20

# Failed logins by IP
grep "login_failed" /data/logs/audit.log | \
  jq -r '.ipAddress' | sort | uniq -c | sort -rn | head -10
```

### Audit Trail Review

Periodically review:
- Failed login patterns (brute force attempts)
- User verification decisions
- Administrative actions (role changes, config updates)
- Document operations (uploads, deletions)

### Updating Secrets

If a secret is compromised:

1. Generate new secret: `openssl rand -base64 32`
2. Update `.env` file
3. Restart the application: `docker compose -f docker-compose.prod.yml restart app`

Changing `NEXTAUTH_SECRET` will invalidate all existing sessions (users must log in again).

## Maintenance Procedures

### Restarting Services

```bash
# Restart application only
docker compose -f docker-compose.prod.yml restart app

# Restart all services
docker compose -f docker-compose.prod.yml restart

# Full restart (stop and start)
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d
```

### Updating the Application

```bash
cd /opt/ivm
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```

Prisma migrations run automatically on container start.

### Database Maintenance

```bash
# Vacuum analyze (reclaim space, update statistics)
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U ivm_user -d ivm_db -c "VACUUM ANALYZE;"

# Reindex
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U ivm_user -d ivm_db -c "REINDEX DATABASE ivm_db;"
```

### Log Rotation

The audit.log file grows over time. To rotate:

```bash
# Move current log and create new one
mv /data/logs/audit.log /data/logs/audit.log.$(date +%Y%m%d)
# App will create a new audit.log on next write

# Compress old logs
gzip /data/logs/audit.log.*

# Or use the built-in cleanup via Admin Console
```

### Cleaning Up Document Trash

Documents in `.trash/` directories can be permanently deleted via the committee documents management UI, or manually:

```bash
# List trash contents
find /data/documents -path "*/.trash/*" -type f

# Remove all trashed files (IRREVERSIBLE)
find /data/documents -path "*/.trash/*" -type f -delete
```
