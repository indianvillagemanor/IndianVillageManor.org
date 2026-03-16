# Priority and Dependencies

## Critical Path
M0 → M1 → M2 → M3 → M4 → M5 → M6 → M7 → M8 → M8.5

This critical path delivers the three requested initial milestones plus profile management:
1. **Anonymous user version (M1)**: Public site with events
2. **Bootstrap user with magic-link login (M2-M4)**: Bootstrap user ("IVM Bootstrap User") can log in, see logout in menu
3. **Verifier flow (M5-M8)**: Complete registration → verification → login flow
4. **Profile management (M8.5)**: Users can update profiles with re-verification

## Key Changes from Original Design
- M2: Added firstName, lastName, SystemConfig, EmailTemplate models
- M3: Added rate limiting, email recovery, basic audit logging, pending user login blocked
- M4: Removed Calendar link (added in M11)
- M5: Added firstName, lastName to registration
- M6: Enhanced verifier notification with more details
- M7: Added denial email with next steps
- M8: Clarified past events definition (calendar month)
- **M8.5: New milestone for profile management**
- M10: Added restore functionality and committee trash
- M11: Added Calendar link to menu, clarified date filtering
- M12: Added bulk operations, SystemConfig UI, EmailTemplate UI
- M13: Enhanced audit logging with volume storage, robot detection, retention
- M15: Added /data/logs volume
- M16: Added [DATABASE_MIGRATIONS.md](../DATABASE_MIGRATIONS.md), migration rollback tests
- M18: Clarified E2E tests written with features
- M20: Added comprehensive monitoring and alerting

## Parallel Development Opportunities
After M8.5, these can be developed in parallel:
- M9 (Committees) + M10 (Documents with restore)
- M11 (Events with calendar link) independent
- M12 (Admin console enhanced) depends on M9
- M13 (Comprehensive audit logging) can be developed alongside features (basic in M3)
- M14 (SSO) can be added after M3
- M15 (Containerization) can be developed early

## Sequential Requirements
Some milestones must be sequential:
- M16 (Backup) requires M15 (Containers) - needs volumes defined
- M17 (Security) should review all prior milestones - comprehensive security audit
- M18 (Testing) covers all prior milestones - test infrastructure and CI/CD
- M19 (Documentation) covers final state - complete docs
- M20 (Performance + Monitoring) requires complete system - final optimization

## Recommended Implementation Order
1. **Phase 1** (M0-M4): Foundation - ~2-3 weeks
2. **Phase 2** (M5-M8.5): User Management - ~2-3 weeks
3. **Phase 3** (M9-M12): Core Features - ~3-4 weeks
   - M9, M10 in parallel
   - M11 independent
   - M12 after M9
4. **Phase 4** (M13-M20): Production Ready - ~3-4 weeks
   - M13 (audit logging) alongside earlier phases
   - M14 (SSO) when ready
   - M15, M16 (deployment/backup) in sequence
   - M17, M18, M19, M20 (security, testing, docs, monitoring) toward end

## Total Estimated Timeline
10-14 weeks for full implementation
