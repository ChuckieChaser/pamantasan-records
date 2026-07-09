# Fix Plan — All Reported Issues

## Issues Overview

### 1. `/api/documents/versions/all` → 404
**Root Cause:** The `/versions/all` route was added to `documents.js` (the backend router), but the backend **server has not been restarted**. The old process is still running without the new route. The front-end is calling the new endpoint correctly.

**Fix:** The server needs to be restarted to pick up the new backend route.

---

### 2. Share Status Errors (Unapprove / Stash — "current transaction is aborted")
**Root Cause:** In the PATCH `/shares/:id` route on the backend, the UPDATE of `document_versions` (to clear `approver_id`) runs in the same transaction AFTER the recursive share update. If the recursive CTE fails or hits a constraint (e.g., the status domain doesn't include `STASHED` yet), the transaction enters a failed state and all subsequent queries (`logAudit`, `createNotification`, etc.) fail with "current transaction is aborted."

**Fix:**
- Wrap the document_versions cross-update in its own try-catch so a failure there doesn't abort the outer transaction.
- Ensure STASHED is handled properly and doesn't try to do a document_versions update (it doesn't need one).

---

### 3. Officer Reject Doesn't Work / Officer Unapprove Error
**Root Cause:** Reject is currently calling `deleteShare`, which should work. But `PENDING_APPROVAL` transition from the Officer side may be hitting the transaction abort cascade from #2.

**Fix:** Same as #2 — isolated try-catch around the cross-update statement.

---

### 4. Size in Header Doesn't Fetch Correctly / Documents Don't Fetch Versions
**Root Cause:** `getAll()` in `useDocumentVersion` was previously a no-op (`() => []`). It was updated to call `/versions/all` but the server wasn't restarted.

**Fix:** Restart the server (fix #1). Also add a `useEffect` in the Inspector to fetch versions for the currently viewed document when it changes.

---

### 5. Versions — Upload Doesn't Create New Version
**Root Cause:** `createDocumentVersion` in the store does a local state push but doesn't re-fetch. If the version was already in state from the old `getAll` no-op, this can leave the display stale.

**Fix:** After `createDocumentVersion`, call `getAll()` (the new `/versions/all` endpoint) to fully refresh state. Add this to `UploadDocumentsModal` and the `create` action in the store.

---

### 6. Non-admin/non-coordinator Must Not See Upload Button
**Root Cause:** Current logic in `Documents.jsx` includes `OFFICER` in `canAddDocuments`.

**Fix:** Restrict to `ADMINISTRATOR` and `COORDINATOR` only.

---

### 7. Download-zip 500 Error
**Root Cause:** The archiver library (`require('archiver')`) is being used inside `withRLS`. If the response headers have already been sent and an error occurs in the archive stream, the `withRLS` error handler tries to set a 500 status which conflicts.

**Fix:** Restructure the download-zip handler to finalize the archive outside `withRLS` (collect the file data inside RLS, then stream outside it).

---

### 8. Requests Page — Non-admin/non-coordinator
**Fix:** Build out a full Requests page with:
- List of their own document requests
- Ability to create a new request
- Ability to view/message each request

---

### 9. PDF / Word File Viewer
**Fix:** Upgrade `ViewDocumentModal` to:
- For PDF: use an `<iframe>` with `src` pointing to `/api/documents/:id/view`
- For Word: display a download link (Word cannot be rendered natively in browsers)

---

## Proposed Changes

### Backend

#### [MODIFY] [documents.js](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/server/backend/routes/documents.js)
- Wrap the `document_versions` cross-update in its own `try-catch` inside the PATCH `/shares/:id` handler.
- Fix `download-zip` to separate file collection (inside RLS) from archive streaming (outside RLS).

### Frontend

#### [MODIFY] [Documents.jsx](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/pages/Documents.jsx)
- Restrict `canAddDocuments` to `ADMINISTRATOR` and `COORDINATOR` only.

#### [MODIFY] [Requests.jsx](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/pages/Requests.jsx)
- Build full request page with list, create, and message threads.

#### [MODIFY] [ViewDocumentModal.jsx](file:///c:/Users/Chuckie/.../ViewDocumentModal.jsx)
- Add proper PDF iframe viewer using the `/view` endpoint.
- Show download prompt for Word/other files.

#### [MODIFY] [useVersion.js](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/stores/document/useVersion.js)
- In `create`, after creating the version, re-fetch all versions.

#### [MODIFY] [Inspector.jsx](file:///c:/Users/Chuckie/.../Inspector.jsx)
- Re-add `useEffect` to fetch versions for the active document when it changes.

---

## Open Questions

> [!IMPORTANT]
> The server **must be restarted** for the `/versions/all` 404 fix to take effect — this is the single most impactful fix and resolves issues 1–5 in one go.

> [!NOTE]
> For the Requests page: should Officers and Members both have access, or only Members?
