# Phase 4 Manual Testing Guide

This guide covers manual testing procedures for all Phase 4 milestones:
- **M13**: Comprehensive Audit Logging System
- **M14**: SSO Authentication
- **M15**: Containerization and Deployment
- **M16**: Backup and Recovery
- **M17**: Security Hardening
- **M18**: Testing Infrastructure and Coverage
- **M19**: Documentation and Operations Guide
- **M20**: Performance Optimization and Monitoring

## Prerequisites

Before running these tests, ensure:

1. Docker is running and the database is up:
   ```bash
   docker-compose up -d
   ```

2. Database is migrated and seeded:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

3. Dev server is running:
   ```bash
   /home/levis/Development/IVM/scripts/kill3000_and_start_dev.sh
   ```

4. Bootstrap user exists: `indianvillagemanor+bootstrap@gmail.com` (dbadmin + verifier roles)

5. Some audit log history exists (perform a few actions like login, register a test user, etc.)

---

## M13: Comprehensive Audit Logging

### Setup
Log in as the bootstrap user (dbadmin) via magic link at http://localhost:3000/auth/login.

---

### Test 1: Audit Log Viewer

1. Navigate to **Admin Console** > **Audit Logs** (`/admin/console/audit-logs`).
2. Verify the page loads with a table of audit log entries.
3. Verify each entry shows: timestamp, action, actor, entity type, success/failure.
4. Click on an entry row to expand — verify JSON details are shown.

**Expected**: Audit log viewer loads with entries and expandable details.

---

### Test 2: Search and Filter

1. On the Audit Logs page, type a search term (e.g., the bootstrap user's email) in the search box.
2. Verify filtered results appear.
3. Use the **Action** dropdown to filter by a specific action type (e.g., `LOGIN_ATTEMPT`).
4. Use the **Date From** / **Date To** fields to restrict by date range.
5. Verify pagination works (if enough entries exist).

**Expected**: Filters narrow down results correctly. Pagination works.

---

### Test 3: CSV Export

1. Apply a filter (e.g., by action type).
2. Click **Export CSV**.
3. Verify a CSV file downloads.
4. Open the CSV — verify it contains the filtered audit log entries with headers.

**Expected**: CSV file downloads with correct data.

---

### Test 4: Log Cleanup

1. Click **Cleanup Old Logs** button.
2. Confirm in the dialog.
3. Verify a success message shows the number of deleted entries (may be 0 if no old entries).

**Expected**: Cleanup runs without error. Message shows deletion count.

---

### Test 5: Bot Detection in Logs

1. From a terminal, make a request with a bot user-agent:
   ```bash
   curl -A "Googlebot/2.1" http://localhost:3000/
   ```
2. Check the audit log — bot page views should NOT appear (filtered out).
3. Make a normal browser request — verify it IS logged.

**Expected**: Bot traffic is silently filtered from anonymous page view logs.

---

### Test 6: Audit Logs Card on Admin Console

1. Navigate to `/admin/console`.
2. Verify the **Audit Logs** card appears in the Console Sections grid.
3. Click it — verify it navigates to the audit log viewer.

**Expected**: Card visible and links correctly.

---

## M14: SSO Authentication

### Test 7: SSO Buttons (Without Credentials)

1. Ensure `GOOGLE_CLIENT_ID` and `AZURE_AD_CLIENT_ID` are NOT set in `.env`.
2. Navigate to `/auth/login`.
3. Verify only the magic link form appears — no SSO buttons visible.

**Expected**: Login page shows only email/magic link when SSO is not configured.

---

### Test 8: SSO Buttons (With Credentials)

1. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` (can be dummy values for UI testing).
2. Restart the dev server.
3. Navigate to `/auth/login`.
4. Verify a **"Continue with Google"** button appears above the magic link form.
5. Verify the "or continue with email" divider is shown between SSO buttons and the email form.

**Expected**: SSO button appears when credentials are configured. Divider separates SSO from email.

---

### Test 9: Provider Info API

1. Call the providers API:
   ```bash
   curl http://localhost:3000/api/auth/providers-info
   ```
2. Verify the response lists configured providers (or empty array if none configured).

**Expected**: JSON response with providers list.

---

### Test 10: SSO Error for Unregistered User

1. Navigate to `/auth/error?error=SSONotRegistered`.
2. Verify the error page shows a message about needing to register first.
3. Verify a link to the registration page is shown.

**Expected**: Clear error message explaining registration is required before SSO login.

---

## M15: Containerization and Deployment

### Test 11: Health Check Endpoint

1. Visit http://localhost:3000/api/health.
2. Verify JSON response with:
   - `status`: "ok"
   - `database`: "connected"
   - `timestamp`: current time
   - `memory`: object with `usedPercent` and `freeMB`
   - `uptime`: number
   - `loadAvg`: string

**Expected**: Health endpoint returns comprehensive status.

---

### Test 12: Dockerfile Validity

1. Verify the Dockerfile exists and is well-formed:
   ```bash
   cat Dockerfile | head -5
   ```
2. Verify `.dockerignore` excludes node_modules, .next, .git, etc.

**Expected**: Dockerfile and .dockerignore exist with correct content.

---

### Test 13: Docker Compose Production Config

1. Verify `docker-compose.prod.yml` exists with three services (postgres, app, nginx).
2. Verify volumes are defined (postgres_data, documents_data, logs_data).
3. Verify `docker-entrypoint.sh` exists and is executable:
   ```bash
   ls -la docker-entrypoint.sh
   ```

**Expected**: Production Docker configuration is complete.

---

### Test 14: Nginx Configuration

1. Verify `nginx/default.conf` exists.
2. Verify it proxies to `app:3000`.
3. Verify security headers are included (X-Frame-Options, X-Content-Type-Options).

**Expected**: Nginx reverse proxy configuration is correct.

---

## M16: Backup and Recovery

### Test 15: Backup Script

1. Verify backup script exists and is executable:
   ```bash
   ls -la scripts/backup/backup.sh
   ```
2. Review the script content — verify it handles:
   - PostgreSQL dump (pg_dump)
   - Documents directory archiving
   - Logs directory archiving
   - Optional encryption
   - Retention cleanup

**Expected**: Backup script exists with all required features.

---

### Test 16: Restore Script

1. Verify restore script exists:
   ```bash
   ls -la scripts/backup/restore.sh
   ```
2. Review the script — verify it:
   - Accepts a backup file path
   - Supports decryption
   - Prompts before database overwrite
   - Restores database, documents, and logs

**Expected**: Restore script exists with interactive confirmation.

---

### Test 17: Crontab Example

1. Verify crontab example exists:
   ```bash
   cat scripts/backup/crontab.example
   ```
2. Verify it schedules daily backup at 2:00 AM.

**Expected**: Crontab example is correct.

---

## M17: Security Hardening

### Test 18: Security Headers

1. Visit http://localhost:3000 and inspect response headers (browser DevTools > Network tab).
2. Verify the following headers are present:
   - `X-Frame-Options: SAMEORIGIN`
   - `X-Content-Type-Options: nosniff`
   - `X-XSS-Protection: 1; mode=block`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Content-Security-Policy` (present and not empty)

**Expected**: All security headers are present on responses.

---

### Test 19: Security Headers on All Routes

1. Check headers on different routes:
   ```bash
   curl -I http://localhost:3000/
   curl -I http://localhost:3000/auth/login
   curl -I http://localhost:3000/api/health
   ```
2. Verify security headers appear on all responses (not just specific routes).

**Expected**: Security headers applied to all non-static responses.

---

### Test 20: Input Sanitization Functions

1. Run the unit tests for sanitize.ts:
   ```bash
   npx jest __tests__/lib/sanitize.test.ts --forceExit
   ```
2. Verify all tests pass:
   - HTML escaping (`<script>` tags escaped)
   - Filename sanitization (path traversal removed)
   - Email sanitization (lowercased, trimmed)
   - SQL injection detection (patterns detected without false positives)

**Expected**: All 14 sanitize unit tests pass.

---

## M18: Testing Infrastructure and Coverage

### Test 21: Jest Unit Tests

1. Run all unit tests:
   ```bash
   npm test -- --forceExit
   ```
2. Verify all tests pass (46 expected).
3. Verify test suites: sanitize.test.ts, audit.test.ts, validation.test.ts.

**Expected**: All 46 tests pass across 3 test suites.

---

### Test 22: Test Coverage Report

1. Run tests with coverage:
   ```bash
   npm run test:coverage -- --forceExit
   ```
2. Verify coverage report is generated.
3. Review coverage summary — verify lib/ files have meaningful coverage.

**Expected**: Coverage report generated with coverage metrics.

---

### Test 23: TypeScript Type Checking

1. Run the type checker:
   ```bash
   npm run typecheck
   ```
2. Verify no TypeScript errors.

**Expected**: Clean type check with no errors.

---

### Test 24: E2E Test Configuration

1. Verify Playwright config exists:
   ```bash
   cat playwright.config.ts
   ```
2. Verify E2E test file exists:
   ```bash
   cat e2e/basic.spec.ts
   ```
3. (Optional) Run E2E tests with a running dev server:
   ```bash
   npm run test:e2e
   ```

**Expected**: Playwright configuration and E2E test files exist. Tests pass when server is running.

---

## M19: Documentation and Operations Guide

### Test 25: README.md Completeness

1. Open `README.md` and verify it contains:
   - Project overview with feature list
   - Prerequisites (Node.js, Docker)
   - Quick Start instructions (5 steps)
   - Project structure tree
   - Available scripts table
   - Environment variables table
   - Links to other documentation

**Expected**: README is comprehensive and up-to-date.

---

### Test 26: [DEPLOYMENT.md](../DEPLOYMENT.md)

1. Open [DEPLOYMENT.md](../DEPLOYMENT.md) and verify it covers:
   - Architecture diagram (Client → Nginx → App → PostgreSQL)
   - Server prerequisites
   - Initial deployment steps
   - SSL/TLS configuration options
   - Updating and rolling back
   - Container management commands
   - Troubleshooting section

**Expected**: [DEPLOYMENT.md](../DEPLOYMENT.md) provides complete deployment guide.

---

### Test 27: [OPERATIONS.md](../OPERATIONS.md)

1. Open [OPERATIONS.md](../OPERATIONS.md) and verify it covers:
   - Data locations table
   - Backup and recovery procedures
   - User administration via admin console
   - System configuration reference
   - Audit log management
   - Monitoring procedures
   - Email troubleshooting
   - Security operations
   - Maintenance procedures

**Expected**: [OPERATIONS.md](../OPERATIONS.md) provides complete operations guide.

---

### Test 28: [API.md](../API.md)

1. Open [API.md](../API.md) and verify it documents:
   - All 26+ API endpoints
   - Request/response formats with examples
   - Authentication requirements per endpoint
   - Error response format
   - HTTP status code reference

**Expected**: [API.md](../API.md) is a complete REST API reference.

---

## M20: Performance Optimization and Monitoring

### Test 29: Monitoring Dashboard

1. Log in as dbadmin.
2. Navigate to **Admin Console** > **Monitoring** (`/admin/console/monitoring`).
3. Verify the dashboard displays:
   - User Statistics: Total Users, Verified Users, Pending Verifications, Denied Users
   - Activity (Last 24 Hours): Failed Login Attempts, Audit Events, Documents
   - Storage: Documents Storage size, Log Storage size
   - System Health: Memory Used %, Load Average, System Uptime

**Expected**: All metric cards display with current values.

---

### Test 30: Metrics Auto-Refresh

1. On the monitoring dashboard, note the "Last updated" timestamp.
2. Wait 60 seconds.
3. Verify the timestamp updates automatically.

**Expected**: Metrics refresh every 60 seconds.

---

### Test 31: Manual Refresh

1. Click the **Refresh Metrics** button.
2. Verify metrics update and the timestamp changes.

**Expected**: Manual refresh works immediately.

---

### Test 32: Run Alert Checks

1. Click **Run Alert Checks**.
2. Verify a result message appears:
   - Green "All checks passed" if no thresholds exceeded
   - Yellow alert list if any thresholds exceeded

**Expected**: Alert check runs and displays results.

---

### Test 33: Monitoring API

1. Test the monitoring API directly:
   ```bash
   # Get metrics (requires auth cookie - use browser or session cookie)
   curl -b <cookie> http://localhost:3000/api/admin/monitoring
   ```
2. Verify JSON response with user stats, disk usage, memory, load, and uptime.

**Expected**: Monitoring API returns comprehensive metrics JSON.

---

### Test 34: Monitoring Card on Admin Console

1. Navigate to `/admin/console`.
2. Verify the **Monitoring** card appears in the Console Sections grid.
3. Click it — verify it navigates to the monitoring dashboard.

**Expected**: Card visible and links correctly.

---

### Test 35: Enhanced Health Endpoint

1. Call the health endpoint:
   ```bash
   curl http://localhost:3000/api/health
   ```
2. Verify response includes:
   - `status`, `timestamp`, `database`
   - `memory` (with `usedPercent` and `freeMB`)
   - `uptime` (seconds)
   - `loadAvg` (1-minute load average)

**Expected**: Health endpoint returns system health metrics.

---

### Test 36: Alert Thresholds in SystemConfig

1. Navigate to **Admin Console** > **System Configuration** (`/admin/console/config`).
2. Verify these alert threshold keys exist:
   - `failed_login_alert_threshold` (default: 3)
   - `disk_alert_threshold_percent` (default: 85)
   - `pending_verification_alert_count` (default: 5)
3. Edit `failed_login_alert_threshold` to a different value (e.g., 10).
4. Save — verify the change persists.
5. (Optional) Reset to original value.

**Expected**: Alert thresholds are configurable via SystemConfig UI.

---

## Summary

| Milestone | Tests | Key Areas |
|-----------|-------|-----------|
| M13 | 1-6 | Audit log viewer, search, export, cleanup, bot detection |
| M14 | 7-10 | SSO buttons, provider API, error handling |
| M15 | 11-14 | Health check, Docker config, Nginx |
| M16 | 15-17 | Backup script, restore script, crontab |
| M17 | 18-20 | Security headers, input sanitization |
| M18 | 21-24 | Unit tests, coverage, type checking, E2E |
| M19 | 25-28 | README, DEPLOYMENT, OPERATIONS, API docs |
| M20 | 29-36 | Monitoring dashboard, alerts, health endpoint |

**Total**: 36 manual test procedures covering all Phase 4 milestones.
