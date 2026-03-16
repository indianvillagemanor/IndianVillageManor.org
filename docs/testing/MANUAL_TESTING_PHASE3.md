# Phase 3 Manual Testing Guide

This guide covers manual testing procedures for all Phase 3 milestones:
- **M09**: Committee System
- **M10**: Document Publishing System
- **M11**: Event Calendar System
- **M12**: Admin Console

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
   ./scripts/kill3000_and_start_dev.sh
   ```

4. Bootstrap user exists: `indianvillagemanor+bootstrap@gmail.com` (dbadmin role)

5. For document tests, the `/data/documents` directory will be auto-created - no manual setup needed.

---

## M09: Committee System

### Setup
Log in as the bootstrap user (dbadmin) via magic link at http://localhost:3000/auth/login.

---

### Test 1: Create Committees

1. Open the hamburger menu — verify **"Committees"** and **"Admin Console"** links are visible (dbadmin only).
2. Click **Committees** → verify the committee list page loads at `/committees`.
3. Click **Create Committee** → opens `/admin/committees/new`.
4. Create a committee:
   - Name: `Board`
   - Description: `HOA Board of Directors`
   - Click **Save**
5. Verify the committee appears in the list.
6. Repeat to create: `Architectural` (desc: `Architectural Review Committee`) and `Social` (desc: `Social Events Committee`).
7. Verify all 3 committees appear in the list with correct member/doc counts (0/0).

**Expected**: Three committees created and listed.

---

### Test 2: Edit a Committee

1. From `/committees`, click **Manage** next to "Board".
2. Edit the description to `Board of Directors – Annual Meeting`.
3. Click **Save**.
4. Verify the updated description appears on the committee detail page.

**Expected**: Description updated.

---

### Test 3: Add Members to Committee

1. Navigate to `/admin/committees/<board-id>` (via Manage button).
2. In the **Manage Members** section, select the bootstrap user from the dropdown.
3. Click **Add Member**.
4. Verify the bootstrap user appears in the members list.

**Expected**: Bootstrap user is now a member of Board.

---

### Test 4: Committee Visibility in Navigation

1. After adding bootstrap user to Board, open the hamburger menu.
2. Verify **Board** now appears under the committee links section.
3. Also verify Architectural and Social do NOT appear (no members, no published docs).

**Expected**: Only Board appears in the navigation for the bootstrap user.

---

### Test 5: Access Control

1. Log out.
2. Attempt to access `/committees` — should redirect to login.
3. Attempt to access `/admin/committees/new` — should redirect to login.

4. Register a new test user (e.g., test@example.com) and get them verified via the verifier dashboard.
5. Log in as the test user.
6. Navigate to `/committees` — should show empty list (no published docs, not a member of any committee).
7. Attempt to access `/admin/committees/new` — should show access denied (not dbadmin).

**Expected**: Non-dbadmin users cannot create/edit committees.

---

### Test 6: Committee Detail Page

1. Log in as bootstrap user (dbadmin).
2. Navigate to `/committees/<board-id>`.
3. Verify the page shows name, description, member list (bootstrap user), and "Edit / Manage Members" button.
4. Log in as the test user from Test 5 — add them as a member of Social (via admin console or committee admin page).
5. Log in as test user — navigate to `/committees` — Social should now appear.
6. Click Social — verify no published documents yet.

**Expected**: Members see their committee detail pages with appropriate content.

---

### Test 7: Delete Committee (Blocked with Documents)

1. Log in as bootstrap user.
2. Navigate to `/admin/committees/<social-id>`.
3. Verify Delete button exists.
4. (After adding a document in M10 tests) Try to delete a committee with documents — verify it is blocked with an error message.

**Expected**: Committee with documents cannot be deleted.

---

## M10: Document Publishing System

### Setup
Ensure:
- Bootstrap user has the **publisher** role AND is a **member of Board** (set up in M09 tests).
- If not, use the Admin Console to assign the publisher role to bootstrap user.

---

### Test 1: Upload a Document

1. Log in as bootstrap user.
2. Navigate to `/committees/<board-id>`.
3. Verify **"Manage Documents"** button is visible.
4. Click **Manage Documents** → opens `/committees/<board-id>/documents`.
5. Enter title: `Meeting Minutes 2026-01`
6. Select a PDF file (create a test PDF or use any existing PDF).
7. Click **Upload**.
8. Verify the document appears in the list with status **Draft**.
9. (Optional) Verify the file was created at `/data/documents/<board-id>/`.

**Expected**: Document uploaded and shows as Draft.

---

### Test 2: Publish a Document

1. On the document management page, click **Publish** next to the uploaded document.
2. Verify status changes to **Published**.
3. Navigate to `/committees/<board-id>`.
4. Verify the document appears in the committee's published documents list.
5. Log out and log in as the verified test user (non-publisher).
6. Navigate to `/committees/<board-id>` — verify the published document is visible.
7. Click **Download** on the document — verify the file is served correctly.

**Expected**: Published documents are visible to all verified users with download functionality.

---

### Test 3: Archive a Document

1. Log back in as bootstrap user.
2. Navigate to `/committees/<board-id>/documents`.
3. Click **Archive** on the published document.
4. Verify status changes to **Archived**.
5. Navigate to `/committees/<board-id>` — verify the document is no longer listed.
6. Navigate back to document management — verify it still shows with Archived status.
7. The direct download URL (`/api/documents/<id>/download`) should still work for archived documents.

**Expected**: Archived documents are hidden from committee page but accessible via direct link.

---

### Test 4: Delete a Document (Move to Trash)

1. Upload a second document: `Annual Report 2025`.
2. Click **Delete** on the second document.
3. Verify it moves to the **Trash** section at the bottom of the manage page.
4. Verify it has a **Deleted** badge and shows Restore/Delete Permanently buttons.
5. Attempt to access `/api/documents/<id>/download` — should return 404.
6. (Optional) Verify the file was moved to `/data/documents/<board-id>/.trash/`.

**Expected**: Deleted documents move to trash and are inaccessible via download.

---

### Test 5: Restore a Deleted Document

1. In the Trash section, click **Restore** on the deleted document.
2. Verify it reappears in the Documents section with **Archived** status.
3. Click **Restore** (publish) on it — verify it becomes Published again.

**Expected**: Deleted → Archived → Published restoration flow works.

---

### Test 6: Restore an Archived Document

1. Click **Restore** on the Archived document (from Test 3).
2. Verify it becomes Published again.
3. Navigate to `/committees/<board-id>` — verify it appears in the list.

**Expected**: Archived documents can be restored to Published.

---

### Test 7: Permanently Delete from Trash

1. Upload a third document and delete it to move to trash.
2. In the Trash section, click **Delete Permanently**.
3. Confirm the browser dialog.
4. Verify the document is completely removed from the UI.
5. (Optional) Verify the file is gone from `/data/documents/<board-id>/.trash/`.

**Expected**: Permanent delete removes document and file entirely.

---

### Test 8: File Validation

1. Attempt to upload a `.txt` or `.exe` file.
2. Verify an error message is shown (invalid file type).
3. Attempt to upload a file with a very long name with special characters — verify it is sanitized.

**Expected**: Only PDF, JPG, PNG files accepted; filenames are sanitized.

---

### Test 9: Publisher Without Membership Cannot Upload

1. Create a new verified user and assign them the publisher role (via Admin Console).
2. Do NOT add them to any committee.
3. Log in as this user.
4. Try to access `/committees/<board-id>/documents` — verify access is denied (403).

**Expected**: Publisher role alone is not sufficient; must also be a committee member.

---

## M11: Event Calendar System

### Setup
Log in as bootstrap user. Use Admin Console to assign the **calendar** role to bootstrap user if not already assigned.

---

### Test 1: Assign Calendar Role and Verify Menu

1. Log in as bootstrap user.
2. Open the hamburger menu — verify **"Calendar"** link is visible.
3. Click Calendar → opens `/events`.
4. Verify **"Create Event"** button is visible (calendar role).

**Expected**: Calendar link in menu; Create Event button visible to calendar role users.

---

### Test 2: Create a Future Event

1. Click **Create Event**.
2. Fill in:
   - Title: `Annual HOA Meeting`
   - Description: `All residents are invited to the annual meeting.`
   - Start: Select a date next month (e.g., 2026-03-15 at 7:00 PM)
   - End: 2026-03-15 at 9:00 PM
3. Click **Create Event**.
4. Verify redirect to `/events` and the event appears in the upcoming month section.
5. Log out — verify the future event is visible to anonymous visitors.

**Expected**: Future events visible publicly.

---

### Test 3: Create a Current Month Event

1. Log in as bootstrap user.
2. Create an event in the current month (e.g., today or this week).
3. Log out.
4. Verify the current month event IS visible to anonymous visitors.

**Expected**: Current calendar month events visible publicly.

---

### Test 4: Create a Past Event

1. Log in as bootstrap user.
2. Create an event with a start date in the previous month.
3. Log out.
4. Verify the past event is NOT visible to anonymous visitors (page should show a login callout).
5. Log in as a verified user.
6. Navigate to `/events` — verify the past event IS visible with a "Past" badge and reduced opacity.

**Expected**: Past events hidden from public; visible to verified users.

---

### Test 5: Calendar Month Boundary

1. Today is in month X. Events in month X or later = public.
2. Events in month X-1 or earlier = require login.
3. Verify the anonymous view shows a callout message near any unlisted past events.

**Expected**: Correct date-based filtering at calendar month boundary.

---

### Test 6: Edit an Event

1. Log in as bootstrap user (calendar role).
2. Navigate to `/events`.
3. Click **Edit** on an existing event.
4. Change the title and description.
5. Click **Save Changes**.
6. Verify the changes appear on the events list.

**Expected**: Event editing works and changes persist.

---

### Test 7: Delete an Event

1. On `/events`, click **Delete** on an event.
2. Verify a confirmation modal appears.
3. Confirm deletion.
4. Verify the event is removed from the list.

**Expected**: Events deleted via in-page confirmation modal (no browser alert).

---

### Test 8: Non-Calendar User Cannot Manage Events

1. Log in as the test user (without calendar role).
2. Navigate to `/events` — verify no Create/Edit/Delete buttons are visible.
3. Attempt to access `/events/new` — verify access denied message.

**Expected**: Only calendar role users see event management controls.

---

### Test 9: Event Form Validation

1. Try to create an event without a title — verify error shown.
2. Try to create an event with endAt before startAt — verify error shown.
3. Successfully create an event with only required fields (no description, no end time).

**Expected**: Validation works correctly.

---

## M12: Admin Console

### Setup
Log in as bootstrap user (dbadmin). The Admin Console link is in the hamburger menu.

---

### Test 1: Admin Console Access

1. Open the hamburger menu — click **Admin Console** → opens `/admin/console`.
2. Verify the dashboard shows navigation cards for: User Management, System Configuration, Email Templates.
3. Log out. Log in as the test verified user (non-dbadmin).
4. Attempt to access `/admin/console` — verify access denied or redirect.

**Expected**: Only dbadmin can access the admin console.

---

### Test 2: User Management — List and Filter

1. Navigate to `/admin/console/users`.
2. Verify all registered users appear in the table.
3. Test search: type a portion of a name or email — verify the list filters.
4. Test status filter: select "Pending" — verify only pending users shown.
5. Select "Verified" — verify only verified users shown.

**Expected**: User list with working search and status filter.

---

### Test 3: User Edit — Roles and Committees

1. Click **Edit** next to the test verified user.
2. Opens `/admin/console/users/<id>`.
3. Verify profile fields are pre-populated.
4. Check the **publisher** role checkbox.
5. Check the **Social** committee checkbox.
6. Click **Save Changes**.
7. Verify success (page reloads or shows confirmation).
8. Navigate back to user list — verify the user now shows the publisher role badge.
9. Log in as that user — navigate to `/committees/<social-id>/documents` — verify access now works.

**Expected**: Role and committee assignments take effect immediately.

---

### Test 4: Bulk Operations

1. Go to `/admin/console/users`.
2. Select 2–3 users using checkboxes.
3. Verify the bulk operations panel appears showing the count.
4. Select role **calendar** from the "Assign Role" dropdown.
5. Click **Assign Role** — confirm the dialog.
6. Verify success message and selected users now have the calendar role.
7. Select the same or different users.
8. Select committee **Social** from the "Add to Committee" dropdown.
9. Click **Add to Committee** — confirm.
10. Verify success.

**Expected**: Bulk role and committee assignment works.

---

### Test 5: System Configuration

1. Navigate to `/admin/console/config`.
2. Verify all SystemConfig entries are listed with descriptions.
3. Change `session_timeout_days` from 90 to 60.
4. Change `disk_alert_threshold_percent` from 85 to 80.
5. Click **Save All Changes**.
6. Verify success message.
7. Reload the page — verify the new values persist.
8. Test validation: enter a non-numeric value in `session_timeout_days` — verify an error.
9. Enter 0 in a numeric field — verify an error (must be positive).

**Expected**: Config changes saved and validated correctly.

---

### Test 6: Email Templates

1. Navigate to `/admin/console/templates`.
2. Verify all email templates are listed (approval, denial, magic-link, etc.).
3. Click on the **approval** template to expand it.
4. Verify the available variables are shown as chips (e.g., `{{firstName}}`, `{{lastName}}`).
5. Edit the subject to: `Welcome to Indian Village Manor, {{firstName}}!`
6. Note the character count updates as you type.
7. Click **Save** on that template.
8. Verify success indicator.
9. Collapse and re-expand the template — verify the new subject persists.
10. Trigger an approval (approve a pending user from `/admin/verify`) — verify the email uses the new subject.

**Expected**: Template changes saved and reflected in outgoing emails.

---

### Test 7: Audit Log Verification

After running the above tests, verify key audit log entries using Prisma Studio:

```bash
npx prisma studio
```

Navigate to the AuditLog table and confirm entries exist for:
- `committee_created` (from M09)
- `document_uploaded` (from M10)
- `document_published` (from M10)
- `event_created` (from M11)
- `user_roles_updated` (from M12)
- `config_updated` (from M12)
- `template_updated` (from M12)

**Expected**: All major operations have corresponding audit log entries.

---

## Cross-Feature Integration Tests

### Integration Test 1: Full Committee + Document Workflow

1. Create committee "Finance" as dbadmin.
2. Add a user with publisher role as a member.
3. As that publisher, upload a document to Finance.
4. Publish the document.
5. Verify it appears in Finance committee detail page.
6. Verify Finance appears in the navigation menu for the publisher.
7. Log in as a different verified user with no special roles.
8. Finance should NOT appear in their navigation (no published docs... wait, it now has one).
9. Actually: Finance SHOULD appear for all verified users since it has a published document.
10. Verify the verified user can see and download the document.

**Expected**: Committees with published documents are visible to all verified users.

---

### Integration Test 2: Admin Console → Calendar → Events

1. As dbadmin, use Admin Console to assign calendar role to a test user.
2. Log in as that test user.
3. Verify Calendar link appears in menu.
4. Create a new event.
5. Log out — verify event is visible publicly if it's current/future month.

**Expected**: Role assignment immediately grants access to event management.

---

### Integration Test 3: Publisher Access Control

1. Create user Alice. Assign publisher role. Add to Board committee.
2. Create user Bob. Assign publisher role. Do NOT add to any committee.
3. Log in as Alice → `/committees/<board-id>/documents` → access granted ✅
4. Log in as Bob → `/committees/<board-id>/documents` → access denied ✅
5. As dbadmin, add Bob to Board.
6. Log in as Bob → `/committees/<board-id>/documents` → access granted ✅

**Expected**: Publisher role + committee membership both required for document management.

---

## Known Limitations and Notes

- **Document storage**: The `/data/documents` directory is created automatically on first upload. In development, this defaults to the local filesystem. In production, this should be a mounted Docker volume.
- **File size limits**: The 25 MB limit is enforced server-side and read from `SystemConfig.max_upload_size_mb`. Very large files may timeout before the size check fires in some browsers.
- **Email sending**: Email notifications (approval, denial, verifier notifications) require a working SMTP configuration in `.env`. In development without SMTP configured, the notification will fail silently (auth/verification actions still succeed).
- **Audit logs**: Visible in Prisma Studio (`npx prisma studio`) under the AuditLog table. A browser UI for audit logs is planned for M13.
- **Past event boundary**: "Past" means before the start of the current calendar month (not just "yesterday").
- **Committee deletion**: Committees with any documents (published, archived, or deleted) cannot be deleted. Documents must be permanently deleted from trash and others removed first.
