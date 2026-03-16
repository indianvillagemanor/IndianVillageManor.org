# Milestone 16: Backup and Recovery

**Goal**: Automated backup of database, documents, and logs with recovery procedures.

**Features**:
- **[DATABASE_MIGRATIONS.md](../DATABASE_MIGRATIONS.md)**: Documentation for production migration strategy (created in this milestone)
- Backup script for:
  - PostgreSQL dump
  - Document volume snapshot (/data/documents)
  - **Audit log volume snapshot (/data/logs)**
- Configurable backup schedule (cron)
- Off-site backup storage (Google Drive, S3, or similar)
- Backup retention policy (30-day rotation)
- Recovery documentation and scripts
- Backup verification (periodic restore tests)
- Encrypted backups
- **Database migration rollback tests**

**Manual Tests**:
1. **Review [DATABASE_MIGRATIONS.md](../DATABASE_MIGRATIONS.md)** - verify migration strategy documented
2. Run backup script manually
3. Verify backup files created in expected location:
   - PostgreSQL dump
   - /data/documents snapshot
   - /data/logs snapshot
4. Verify backups uploaded to off-site storage
5. Perform recovery test:
   - Stop containers
   - Clear volumes
   - Restore from backup (database + documents + logs)
   - Start containers
   - Verify data is restored correctly
   - Verify audit logs restored
6. Test automated backup schedule (wait for cron trigger)
7. Verify old backups are cleaned up per retention policy
8. **Test database migration rollback**:
   - Apply a test migration
   - Verify rollback procedure works (see [DATABASE_MIGRATIONS.md](../DATABASE_MIGRATIONS.md))
9. Verify backups are encrypted

**Automated Tests**:
- Backup script completes successfully
- Backup files have expected format and content
- Database restore from backup works
- File restoration from backup works (documents + logs)
- Backup verification logic
- Retention cleanup removes old backups
- Encryption of backups
- **Migration rollback test** (test schema rollback)
