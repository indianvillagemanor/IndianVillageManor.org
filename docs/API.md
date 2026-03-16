# API Reference

REST API endpoints for the Indian Village Manor application. All endpoints are under `/api/`.

## Authentication

Most endpoints require authentication via NextAuth session cookie. Admin endpoints require specific roles.

| Role Required | Endpoints |
|--------------|-----------|
| None (public) | `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/recover-email`, `GET /api/auth/providers-info` |
| Authenticated | `GET/PUT /api/profile`, `GET /api/events`, `GET /api/committees/visible`, `GET /api/committees/[id]` |
| verifier | `GET/POST /api/admin/verify` |
| calendar or dbadmin | `POST /api/events`, `PUT/DELETE /api/events/[id]` |
| publisher or dbadmin | `POST /api/committees/[id]/documents`, `PATCH/DELETE /api/documents/[id]` |
| dbadmin | All `/api/admin/*` endpoints |

---

## Public Endpoints

### Health Check

```
GET /api/health
```

Returns application and database health status.

**Response** (200):
```json
{
  "status": "ok",
  "timestamp": "2026-02-17T15:30:00.000Z",
  "database": "connected"
}
```

**Response** (503 - degraded):
```json
{
  "status": "degraded",
  "timestamp": "...",
  "database": "disconnected"
}
```

### Register

```
POST /api/auth/register
```

Register a new user account (status: pending).

**Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "unitNumber": "101A",
  "isResident": true,
  "isOwner": false
}
```

**Response** (201): `{ "message": "Registration successful..." }`
**Error** (400): Validation errors or duplicate email
**Error** (429): Rate limited

### Recover Email

```
POST /api/auth/recover-email
```

Look up registered email by unit number.

**Body**: `{ "unitNumber": "101A" }`
**Response** (200): `{ "email": "j***@example.com" }` (masked)

### SSO Providers Info

```
GET /api/auth/providers-info
```

Returns list of configured SSO providers.

**Response** (200):
```json
{
  "providers": [
    { "id": "google", "name": "Google" },
    { "id": "azure-ad", "name": "Microsoft" }
  ]
}
```

---

## User Profile

### Get Profile

```
GET /api/profile
```

Returns current user's profile. Requires authentication.

**Response** (200):
```json
{
  "id": "...",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "555-123-4567",
  "unitNumber": "101A",
  "verificationStatus": "verified",
  "roles": [{ "id": "...", "name": "resident" }, { "id": "...", "name": "user" }]
}
```

### Update Profile

```
PUT /api/profile
```

Update current user's profile. Changes to name, phone, unit, or roles trigger re-verification.

**Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "555-123-9999",
  "unitNumber": "101A",
  "isResident": true,
  "isOwner": true
}
```

**Response** (200): Updated user object

---

## Events

### List Events

```
GET /api/events
```

Returns events. Anonymous/unverified users see only current month onward. Verified users see all.

**Response** (200): `[{ "id": "...", "title": "...", "startAt": "...", "endAt": "...", "location": "...", "description": "..." }]`

### Create Event

```
POST /api/events
```

Requires `calendar` or `dbadmin` role.

**Body**:
```json
{
  "title": "Board Meeting",
  "description": "Monthly board meeting",
  "startAt": "2026-03-15T18:00:00Z",
  "endAt": "2026-03-15T20:00:00Z",
  "location": "Community Room"
}
```

### Get/Update/Delete Event

```
GET    /api/events/[id]
PUT    /api/events/[id]    # calendar or dbadmin
DELETE /api/events/[id]    # calendar or dbadmin
```

---

## Committees

### Visible Committees

```
GET /api/committees/visible
```

Returns committees visible to current user (based on membership, published documents, roles).

**Response** (200):
```json
[
  {
    "id": "...",
    "name": "Board of Directors",
    "memberCount": 5,
    "documentCount": 3
  }
]
```

### Committee Detail

```
GET /api/committees/[id]
```

Returns committee details including published documents and members (members visible to dbadmin/committee members only).

### Upload Document

```
POST /api/committees/[id]/documents
```

Upload a document to a committee. Requires `publisher` role (and committee membership) or `dbadmin`.

**Body**: `multipart/form-data` with `file`, `title`, `description` fields.

**Constraints**:
- Allowed types: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, JPG, PNG, GIF
- Max size: configurable via SystemConfig `max_upload_size_mb` (default 25 MB)
- Filenames sanitized (special chars replaced, UUID prefix added)

---

## Documents

### Update Document Status

```
PATCH /api/documents/[id]
```

Change document status. Requires publisher or dbadmin role.

**Body**: `{ "status": "published" }` or `{ "status": "archived" }`

### Delete Document (Soft)

```
DELETE /api/documents/[id]
```

Moves document to committee trash. File moved to `.trash/` directory.

### Restore Document

```
POST /api/documents/[id]/restore
```

Restores a deleted document back to archived status.

### Permanent Delete

```
DELETE /api/documents/[id]/permanent
```

Permanently deletes document from trash. File removed from disk. Irreversible.

### Download Document

```
GET /api/documents/[id]/download
```

Serves the document file. Requires authentication and committee access.

---

## Admin: User Verification

### List Pending Users

```
GET /api/admin/verify
```

Returns pending user registrations. Requires `verifier` role.

### Approve/Deny User

```
POST /api/admin/verify
```

**Body**:
```json
{
  "userId": "...",
  "action": "approve",
  "comment": "Verified unit ownership"
}
```

Action: `"approve"` or `"deny"`.

---

## Admin: User Management

### List Users

```
GET /api/admin/users
GET /api/admin/users?all=true          # All users (for dropdowns)
GET /api/admin/users?search=john       # Search by name/email
GET /api/admin/users?status=verified   # Filter by status
```

Requires `dbadmin` role.

### Get/Update User

```
GET /api/admin/users/[id]
PUT /api/admin/users/[id]
```

PUT body can include: `firstName`, `lastName`, `phone`, `unitNumber`, `verificationStatus`, `roleIds[]`, `committeeIds[]`.

### Bulk Operations

```
POST /api/admin/users/bulk
```

**Body**:
```json
{
  "userIds": ["id1", "id2"],
  "action": "addRole",
  "roleId": "..."
}
```

Actions: `addRole`, `addCommittee`.

---

## Admin: Committees

### List/Create Committees

```
GET  /api/admin/committees        # List all
POST /api/admin/committees        # Create new
```

**POST body**: `{ "name": "...", "description": "..." }`

### Get/Update/Delete Committee

```
GET    /api/admin/committees/[id]
PUT    /api/admin/committees/[id]
DELETE /api/admin/committees/[id]    # Blocked if committee has documents
```

### Manage Members

```
POST   /api/admin/committees/[id]/members    # Add member
DELETE /api/admin/committees/[id]/members    # Remove member
```

**Body**: `{ "userId": "..." }`

---

## Admin: System Config

### Get/Update Config

```
GET /api/admin/config             # All config entries
PUT /api/admin/config             # Update a config entry
```

**PUT body**: `{ "key": "max_login_attempts", "value": "10" }`

---

## Admin: Email Templates

### List Templates

```
GET /api/admin/templates          # All templates
```

### Get/Update Template

```
GET /api/admin/templates/[id]
PUT /api/admin/templates/[id]
```

**PUT body**: `{ "subject": "...", "body": "..." }`

---

## Admin: Audit Logs

### Query Logs

```
GET /api/admin/audit-logs
GET /api/admin/audit-logs?action=login_success
GET /api/admin/audit-logs?userId=...
GET /api/admin/audit-logs?dateFrom=2026-01-01&dateTo=2026-02-01
GET /api/admin/audit-logs?export=csv
GET /api/admin/audit-logs?page=2&pageSize=50
```

**Response** (200):
```json
{
  "logs": [...],
  "total": 150,
  "page": 1,
  "pageSize": 50
}
```

### Cleanup Old Logs

```
POST /api/admin/audit-logs
```

Deletes logs older than configured retention periods. Returns count of deleted entries.

---

## Error Responses

All endpoints return errors in the format:

```json
{
  "error": "Description of what went wrong"
}
```

Common HTTP status codes:
- `400` - Bad request / validation error
- `401` - Not authenticated
- `403` - Not authorized (insufficient role)
- `404` - Resource not found
- `429` - Rate limited
- `500` - Server error
