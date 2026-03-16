# Indian Village Manor - Database Migration Strategy

## Overview

This document describes the strategy for deploying database schema changes to production safely, including rollback procedures and testing requirements.

## Migration Philosophy

1. **Zero Downtime**: Migrations should not cause application downtime
2. **Rollback Safe**: All migrations must be reversible
3. **Data Preserving**: Never lose user data during migration
4. **Tested**: All migrations tested in staging before production
5. **Documented**: Each migration includes clear description and rollback steps

---

## Development Workflow

### Creating a New Migration

1. **Modify Schema**
   ```bash
   # Edit prisma/schema.prisma
   vim prisma/schema.prisma
   ```

2. **Generate Migration**
   ```bash
   # Create migration files
   npx prisma migrate dev --name descriptive_migration_name

   # Example:
   npx prisma migrate dev --name add_email_templates
   ```

3. **Review Generated SQL**
   ```bash
   # Check the generated migration file
   cat prisma/migrations/YYYYMMDDHHMMSS_descriptive_migration_name/migration.sql
   ```

4. **Test Migration**
   ```bash
   # Verify migration applies successfully
   npx prisma migrate dev

   # Verify Prisma Client generation
   npx prisma generate

   # Run application tests
   npm test
   ```

5. **Test Rollback**
   ```bash
   # Reset database to test clean migration
   npx prisma migrate reset

   # Re-apply migration
   npx prisma migrate dev
   ```

---

## Migration Types

### 1. Additive Migrations (Safe)

**Examples**:
- Adding new table
- Adding new column with default value
- Adding new optional column
- Adding index

**Strategy**: Deploy directly
```sql
-- Example: Adding optional column
ALTER TABLE "User" ADD COLUMN "middleName" TEXT;
```

**Rollback**:
```sql
ALTER TABLE "User" DROP COLUMN "middleName";
```

---

### 2. Transformative Migrations (Requires Care)

**Examples**:
- Renaming column
- Changing column type
- Making column required
- Changing relationships

**Strategy**: Multi-step deployment

#### Example: Making a Column Required

**Bad Approach** (causes errors):
```sql
-- Don't do this in one step!
ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;
```

**Good Approach** (multi-step):

**Step 1** (Deploy v1.1): Add column as optional, backfill data
```sql
-- Migration 1: Add as optional
ALTER TABLE "User" ADD COLUMN "phone" TEXT;

-- Application code starts writing phone for new users
-- Backfill script runs: UPDATE "User" SET phone = '<default>' WHERE phone IS NULL;
```

**Step 2** (Deploy v1.2): Make column required
```sql
-- Migration 2: After all rows have phone value
ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;
```

---

### 3. Breaking Migrations (High Risk)

**Examples**:
- Dropping column
- Dropping table
- Removing NOT NULL constraint

**Strategy**: Multi-step with safety period

#### Example: Removing a Column

**Step 1** (Deploy v2.0): Stop using column in application
- Deploy application code that doesn't read/write the column
- Monitor for 1-2 weeks to ensure no issues

**Step 2** (Deploy v2.1): Rename column to deprecate
```sql
-- Mark as deprecated
ALTER TABLE "User" RENAME COLUMN "oldField" TO "_deprecated_oldField";
-- Add comment
COMMENT ON COLUMN "User"."_deprecated_oldField" IS 'Deprecated on 2024-01-15, safe to remove after 2024-02-15';
```

**Step 3** (Deploy v2.2 - after safety period): Drop column
```sql
-- After safety period (30 days)
ALTER TABLE "User" DROP COLUMN "_deprecated_oldField";
```

---

## Production Deployment Strategy

### Pre-Deployment Checklist

- [ ] Migration tested in development environment
- [ ] Migration tested in staging environment
- [ ] Rollback procedure documented and tested
- [ ] Database backup completed
- [ ] Downtime window scheduled (if required)
- [ ] Team notified of deployment
- [ ] Monitoring alerts configured

### Deployment Methods

#### Option 1: Blue-Green Deployment (Recommended)

**Architecture**:
- Blue environment: Current production
- Green environment: New version with migration

**Process**:
1. **Deploy Green**:
   ```bash
   # On green environment
   npx prisma migrate deploy
   docker-compose up -d app_green
   ```

2. **Test Green**:
   - Smoke tests on green environment
   - Verify database migration successful
   - Check application functionality

3. **Switch Traffic**:
   ```bash
   # Update nginx/load balancer to point to green
   # Can be instant switchover or gradual (canary)
   ```

4. **Monitor**:
   - Watch logs for errors
   - Monitor database performance
   - Check user-reported issues

5. **Rollback if Needed**:
   ```bash
   # Switch traffic back to blue
   # Rollback database migration on green
   ```

**Advantages**:
- Zero downtime
- Instant rollback
- Can test production environment before full deployment

**Disadvantages**:
- Requires double infrastructure
- Database must support both versions during transition

---

#### Option 2: Rolling Deployment

**Process**:
1. **Apply Migration**:
   ```bash
   # On production database (with connection limit)
   npx prisma migrate deploy
   ```

2. **Deploy Application**:
   ```bash
   # Rolling update of application containers
   docker-compose up -d --no-deps --build app
   ```

3. **Monitor**:
   - Watch each container as it starts
   - Verify database connection
   - Check for migration errors

**Advantages**:
- No duplicate infrastructure
- Simpler setup

**Disadvantages**:
- Brief inconsistency during rollout
- Requires backward-compatible migrations

---

#### Option 3: Maintenance Window

**For complex/breaking migrations only**

**Process**:
1. **Notify Users**: Send email notification 48 hours ahead
2. **Enable Maintenance Mode**:
   ```bash
   # nginx maintenance page
   cp maintenance.html /var/www/maintenance.html
   # Update nginx config to serve maintenance page
   ```

3. **Backup Database**:
   ```bash
   pg_dump -U postgres ivm_db > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

4. **Apply Migration**:
   ```bash
   npx prisma migrate deploy
   ```

5. **Deploy Application**:
   ```bash
   docker-compose up -d --build
   ```

6. **Test**:
   - Run smoke tests
   - Verify critical functionality
   - Check database integrity

7. **Disable Maintenance Mode**:
   ```bash
   # Restore normal nginx config
   ```

8. **Monitor**: Watch for issues for 1-2 hours

---

## Rollback Procedures

### Automatic Rollback (Prisma)

Prisma doesn't support automatic rollback, so we handle it manually.

### Manual Rollback Process

1. **Identify Migration to Rollback**:
   ```bash
   npx prisma migrate status
   ```

2. **Application Rollback**:
   ```bash
   # Deploy previous application version
   docker-compose down
   docker-compose -f docker-compose.v1.0.yml up -d
   ```

3. **Database Rollback**:

   **Option A**: Restore from backup
   ```bash
   # Stop application
   docker-compose stop app

   # Restore database
   psql -U postgres -d ivm_db < backup_YYYYMMDD_HHMMSS.sql

   # Restart application
   docker-compose start app
   ```

   **Option B**: Manual rollback SQL
   ```bash
   # Run rollback script
   psql -U postgres -d ivm_db < migrations/rollback_YYYYMMDDHHMMSS.sql
   ```

4. **Mark Migration as Rolled Back**:
   ```bash
   # Prisma doesn't track this, document in deployment log
   echo "$(date): Rolled back migration YYYYMMDDHHMMSS" >> deployment.log
   ```

---

## Migration Testing

### Test Environments

1. **Development**: Developer machines
2. **Staging**: Production-like environment
3. **Production**: Live environment

### Test Cases for Each Migration

1. **Fresh Migration**:
   ```bash
   # Test clean installation
   npx prisma migrate reset
   npx prisma migrate dev
   npx prisma db seed
   # Run application tests
   npm test
   ```

2. **Incremental Migration**:
   ```bash
   # From previous version
   git checkout v1.0
   npx prisma migrate reset
   npx prisma migrate dev
   git checkout v1.1
   npx prisma migrate dev
   # Run application tests
   npm test
   ```

3. **Rollback Test**:
   ```bash
   # Apply migration
   npx prisma migrate dev
   # Test rollback
   psql -U postgres -d ivm_db < migrations/rollback_XXX.sql
   # Verify application works with rolled-back schema
   ```

4. **Performance Test**:
   ```bash
   # Test migration on database with production-like data volume
   # Measure migration duration
   time npx prisma migrate deploy
   ```

5. **Load Test**:
   ```bash
   # Test application under load with new schema
   docker-compose up -d
   artillery run load-test.yml
   ```

---

## Common Migration Patterns

### Adding Email Templates

```sql
-- Migration up
INSERT INTO "EmailTemplate" (id, key, subject, body, variables) VALUES
  (uuid_generate_v4(), 'new-template', 'Subject', 'Body {{variable}}', '["variable"]');

-- Migration down (rollback)
DELETE FROM "EmailTemplate" WHERE key = 'new-template';
```

### Adding System Config

```sql
-- Migration up
INSERT INTO "SystemConfig" (id, key, value, description) VALUES
  (uuid_generate_v4(), 'new-config', 'default-value', 'Description');

-- Migration down (rollback)
DELETE FROM "SystemConfig" WHERE key = 'new-config';
```

### Adding a Column with Backfill

```sql
-- Migration up
ALTER TABLE "User" ADD COLUMN "displayName" TEXT;
UPDATE "User" SET "displayName" = "firstName" || ' ' || "lastName";

-- Migration down (rollback)
ALTER TABLE "User" DROP COLUMN "displayName";
```

---

## Monitoring During Migration

### Key Metrics to Watch

1. **During Migration**:
   - Migration execution time
   - Database lock duration
   - Connection pool utilization
   - Transaction log size

2. **After Migration**:
   - Application error rate
   - API response times
   - Database query performance
   - User-reported issues

### Automated Alerts

Set up alerts for:
- Migration failure
- Application startup errors after migration
- Spike in error rates
- Database performance degradation
- Connection pool exhaustion

### Monitoring Commands

```bash
# Check migration status
npx prisma migrate status

# Watch database connections
watch -n 1 'psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"'

# Monitor database locks
psql -U postgres -c "SELECT * FROM pg_locks WHERE NOT granted;"

# Check application logs
docker-compose logs -f app | grep ERROR
```

---

## Emergency Procedures

### If Migration Fails

1. **Stop Application** (prevent corrupt writes):
   ```bash
   docker-compose stop app
   ```

2. **Assess Damage**:
   ```bash
   npx prisma migrate status
   psql -U postgres -d ivm_db -c "SELECT * FROM _prisma_migrations;"
   ```

3. **Decide**: Fix forward or rollback

   **Fix Forward**:
   ```bash
   # Manually complete migration
   psql -U postgres -d ivm_db < fix.sql
   # Mark migration as complete
   ```

   **Rollback**:
   ```bash
   # Restore from backup
   psql -U postgres -d ivm_db < backup.sql
   ```

4. **Restart Application**:
   ```bash
   docker-compose start app
   ```

5. **Post-Incident**:
   - Document what happened
   - Update migration script to prevent recurrence
   - Test updated migration in staging

---

### If Application Fails After Migration

1. **Quick Rollback**:
   ```bash
   # Switch to previous version (blue-green)
   # or
   docker-compose down
   docker-compose -f docker-compose.v1.0.yml up -d
   ```

2. **Investigate**:
   ```bash
   docker-compose logs app
   # Look for schema mismatch errors
   ```

3. **Fix**:
   - Update application code to match schema
   - or rollback database schema

---

## Best Practices

### Do's

- ✅ Always backup before migration
- ✅ Test migrations in staging first
- ✅ Use transactions for data migrations
- ✅ Add indexes during low-traffic periods
- ✅ Document rollback procedure for each migration
- ✅ Monitor application after deployment
- ✅ Keep migration scripts in version control
- ✅ Use descriptive migration names

### Don'ts

- ❌ Don't deploy migrations during peak traffic
- ❌ Don't skip staging testing
- ❌ Don't make breaking changes without multi-step deployment
- ❌ Don't delete data without backup
- ❌ Don't forget to update Prisma Client (`npx prisma generate`)
- ❌ Don't ignore migration warnings
- ❌ Don't apply untested migrations to production
- ❌ Don't modify migration files after they're deployed

---

## Migration Checklist

Use this checklist for each production migration:

### Pre-Deployment (T-48 hours)
- [ ] Migration tested in development
- [ ] Migration tested in staging with production-like data
- [ ] Rollback procedure documented and tested
- [ ] Performance impact assessed
- [ ] Deployment window scheduled
- [ ] Team notified
- [ ] User notification sent (if downtime required)

### Pre-Deployment (T-1 hour)
- [ ] Database backup completed and verified
- [ ] Backup restored to test environment successfully
- [ ] Monitoring dashboards ready
- [ ] Rollback procedure reviewed
- [ ] Team on standby

### During Deployment
- [ ] Maintenance mode enabled (if required)
- [ ] Migration applied successfully
- [ ] Prisma Client regenerated
- [ ] Application deployed
- [ ] Smoke tests passed
- [ ] Monitoring shows normal metrics

### Post-Deployment (T+2 hours)
- [ ] No errors in application logs
- [ ] Database performance normal
- [ ] User-reported issues checked
- [ ] Team debriefed
- [ ] Documentation updated
- [ ] Deployment log updated

---

## Useful Commands Reference

```bash
# Check current migration status
npx prisma migrate status

# Deploy pending migrations (production)
npx prisma migrate deploy

# Create a new migration (development)
npx prisma migrate dev --name migration_name

# Reset database (development only - destroys all data!)
npx prisma migrate reset

# Generate Prisma Client after migration
npx prisma generate

# Open Prisma Studio to inspect database
npx prisma studio

# Create SQL backup
pg_dump -U postgres ivm_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from SQL backup
psql -U postgres -d ivm_db < backup_YYYYMMDD_HHMMSS.sql

# Check database size
psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('ivm_db'));"

# Check migration files
ls -la prisma/migrations/

# View migration SQL
cat prisma/migrations/*/migration.sql
```

---

## Questions or Issues

For questions about database migrations, see:
- [DATABASE.md](./DATABASE.md) for schema documentation
- [DESIGN.md](./DESIGN.md) for business requirements
- [OPERATIONS.md](./OPERATIONS.md) for operational procedures

For help with stuck migrations or emergencies, contact the development team lead.
