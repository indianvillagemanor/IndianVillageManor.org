# Testing Strategy Summary

## Manual Testing Checklist
Each milestone includes specific manual test steps. For acceptance testing:
1. Start with anonymous user experience (M1)
2. Verify bootstrap user login (M2-4)
3. Complete full verifier flow (M5-8)
4. Test user profile management (M8.5)
5. Test all role-specific features (M9-12)
6. Verify comprehensive audit logging (M13)
7. Verify security features (M17)
8. Perform backup/recovery test (M16)
9. Verify monitoring and alerting (M20)

## Automated Testing Approach
- Unit tests: Run on every commit
- Integration tests: Run on every commit
- **E2E tests: Written alongside features in M3-M13, run before deployment**
- CI pipeline: Lint → TypeCheck → Unit Tests → Integration Tests → Build → E2E Tests
- Coverage requirements: >80% for critical paths

## Acceptance Criteria for Completion
- [ ] All milestones completed and tested (M0-M20)
- [ ] All automated tests passing (unit, integration, E2E)
- [ ] Security audit completed (M17)
- [ ] Performance benchmarks met (M20)
- [ ] Documentation complete (M19, including [DATABASE.md](../DATABASE.md) and [DATABASE_MIGRATIONS.md](../DATABASE_MIGRATIONS.md))
- [ ] Backup/recovery procedures tested (M16)
- [ ] Migration rollback tested (M16)
- [ ] Monitoring and alerting operational (M20)
- [ ] Production deployment successful (M15)
- [ ] User acceptance testing passed by stakeholders
