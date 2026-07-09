# Full House Rundown — Bug Report & Implementation Plan

> Cross-referenced against `logic_flow.md`, `server_business_logic.md`, the database schema, all backend routes, client services, and stores.

---

## 🔴 CRITICAL — Will Crash or Silently Fail

### Bug #1 — `PATCH /api/documents/:id` Missing `$` on Parameterized Placeholders
**File:** [`documents.js`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/server/backend/routes/documents.js#L722-L732)

The SQL query builder uses `updates.push(`field = ${i++}`)` — it interpolates the counter as a raw integer directly into the SQL string instead of using proper `$` placeholders. This generates malformed SQL like `UPDATE documents SET name = 1 WHERE id = 2`, crashing every document rename and archive operation.

**Fix:** Change all `= ${i++}` to `= $${i++}`.

---

### Bug #2 — `GET /api/documents/shares/all` is at the BOTTOM of the file (Line 793)
**File:** [`documents.js`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/server/backend/routes/documents.js#L793)

The route `GET /shares/all` is defined **after** `GET /:id` (line 465), `GET /:id/versions`, `GET /:id/download`, etc. Express will intercept `GET /shares/all` with `GET /:id` first, treating `"shares"` as the `:id` UUID and causing a PostgreSQL UUID cast error.

**Fix:** Move `GET /shares/all` to the top of the route file, before any parameterized routes.

---

### Bug #3 — `action()` Wrapper Silently Swallows Errors & Returns `null`
**File:** [`utilities.js`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/stores/utilities.js)

The `action` wrapper in stores catches all errors and returns `null`. Any component code that does `const result = await create(data); result.id` will crash with `Cannot read properties of null (reading 'id')` — silently, with no UI feedback to the user. This is particularly dangerous in the `UploadDocumentsModal.jsx` where it does `const folder = await createDocument(...); docId = folder.id`.

**Fix:** Re-throw the error so components can handle it, OR return `{ data, error }` shape. The safer fix is to re-throw.

---

### Bug #4 — `Onboarding.jsx` Calls `useUser().update()` But `action()` Returns `null` on Error
**File:** [`Onboarding.jsx`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/pages/Onboarding.jsx)

`handlePasswordSubmit` does `const updatedUser = await update(...)` and then calls `updateUser(updatedUser)`. If the API fails, `updatedUser` will be `null` (because of Bug #3), and `updateUser(null)` will silently corrupt or no-op the session. The user sees no error.

**Fix:** `action()` should re-throw. The component's try/catch will then correctly surface the error message.

---

### Bug #5 — `coordinators.js` PATCH Uses Two Nested `withRLS` Calls That Conflict with `BEGIN`/`COMMIT`
**File:** [`coordinators.js`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/server/backend/routes/coordinators.js#L103-L233)

The route manually calls `await client.query('BEGIN')` at the start (line 103), then calls `withRLS()` which also calls `BEGIN` internally. This creates nested transactions which is invalid in PostgreSQL and will cause `ERROR: there is already a transaction in progress`.

**Fix:** Remove the manual `BEGIN`/`COMMIT`/`ROLLBACK` calls at lines 103 and 233. The `withRLS` wrapper already manages transactions.

---

## 🟠 HIGH — Wrong Behavior / Data Integrity Issues

### Bug #6 — `documents.js` `GET /shares/all` Has No Filter Support
**File:** [`documents.js`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/server/backend/routes/documents.js#L794-L806)

The client calls `GET /documents/shares/all?document_id=xxx` but the server ignores query params and returns ALL shares. This means the `getSharesByDocId()` method returns the wrong data.

**Fix:** Add `document_id` query param filtering to `GET /shares/all`.

---

### Bug #7 — `UserModal.jsx` Sends `password` Field on Create But Backend Ignores It
**File:** [`UserModal.jsx`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/components/management/UserModal.jsx#L148-L161) / [`users.js`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/server/backend/routes/users.js#L55-L98)

When Admin creates a user, `UserModal.jsx` sends `{ ..., password: finalPassword }`. However, the `POST /api/users` handler only inserts into the `users` table. The database trigger (`trigger_initialize_user_data`) sets `password_hash = university_id`. The `password` field from the form is completely ignored, meaning the custom password set in the form has no effect.

**Fix:** After inserting the user row in `POST /api/users`, if `req.body.password` is provided and it differs from `university_id`, hash it and update `user_credentials`.

---

### Bug #8 — `notification.js` Service Has No Error Boundary
**File:** [`notification.js`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/server/backend/services/notification.js)

If a notification insert fails (e.g., invalid recipient_id), the error propagates up and rolls back the **entire parent transaction** — meaning the actual business action (creating a user, sharing a document) also gets rolled back. A failed notification should never abort the primary action.

**Fix:** Wrap the notification query in its own try/catch and log the error instead of throwing.

---

### Bug #9 — `audit.js` Service Has the Same Error Propagation Issue
**File:** [`audit.js`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/server/backend/services/audit.js)

Same as Bug #8. A failing audit log insert should never roll back the business action.

**Fix:** Wrap in try/catch and log the failure.

---

### Bug #10 — `NewFolderModal.jsx` Uses `useDocumentVersion` But Folders Have No Versions
**File:** [`NewFolderModal.jsx`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/components/documents/NewFolderModal.jsx#L2-L9)

`NewFolderModal` imports `useDocumentVersion` from stores but never uses it. It's a dead import — harmless but messy.

**Fix:** Remove the unused import.

---

### Bug #11 — `user_settings` & `user_credentials` GET Route Is at `/:id/settings`
**File:** [`users.js`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/server/backend/routes/users.js#L163-L200)

`GET /api/users/:id/settings` and `PATCH /api/users/:id/settings` — these both correctly follow AFTER the `GET /:id` route (which they will not conflict with since `/settings` is a nested path). This is actually fine. ✅

---

### Bug #12 — `PATCH /api/users/:id` Notification Fires Even When User Updates Themselves
**File:** [`users.js`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/server/backend/routes/users.js#L144-L152)

The notification check `if (userId !== userRow.id)` compares the actor (admin/coordinator) to the target user. This is correct for avoiding self-notification on normal updates. However during onboarding, the user updates **themselves** (changing password + status), and they still won't get notified (which is fine). This is actually correct behavior. ✅

---

## 🟡 MEDIUM — Missing Validation / Edge Cases

### Bug #13 — `university_id` Format Not Validated on Backend
**File:** [`users.js`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/server/backend/routes/users.js#L55-L58)

The DB has a CHECK constraint `^[0-9]{2}-[0-9]{5}$` but the backend returns a generic 500 error if this constraint fails. The client gets a vague message.

**Fix:** Catch the constraint violation `error.code === '23514'` and return a clear 400 message.

---

### Bug #14 — `email` Constraint Not Caught Cleanly
**File:** [`users.js`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/server/backend/routes/users.js#L93-L95)

The 409 already catches `23505` (unique violation), but there's also `23514` for the email format constraint `@university.edu.ph`. Only the unique violation is caught.

**Fix:** Add `23514` handling.

---

### Bug #15 — `stores/utilities.js` `action()` Doesn't Re-throw Errors
Same as Bug #3 — this is the root cause for many silent failures. The action utility is used by every store.

---

## 🔵 LOGIC / ALIGNMENT ISSUES

### Bug #16 — `GET /api/documents/shares/all` Returns Shares Without Joining Document Data
**File:** [`documents.js`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/server/backend/routes/documents.js#L793-L806)

The endpoint just does `SELECT * FROM document_shares` with no JOINs. The `DocumentRequestInspector.jsx` and the document browser need document name, folder path, etc. to display meaningfully. The current response gives only bare IDs.

**Fix:** Join `documents` and `users` to enrich the share record.

---

### Bug #17 — Coordinator Sandbox `USER_CREATE` Executes INSERT But Trigger Will Re-run
**File:** [`coordinators.js`](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/server/backend/routes/coordinators.js#L124-L131)

When a coordinator's `USER_CREATE` request is approved, the system executes `INSERT INTO users(...)` as SYSTEM role. The `trigger_initialize_user_data` will fire and seed `user_credentials` with `university_id`. This is correct ✅ — but the sandbox payload also sends `password`, which is ignored in the sandbox execution unlike the direct `POST /api/users`.

**Fix:** After the sandbox INSERT, if `data.password` is set and differs from `data.university_id`, hash and update `user_credentials`.

---

## Summary of Fixes to Execute

| # | File | Fix |
|---|------|-----|
| 1 | `server/backend/routes/documents.js` | Fix `= ${i}` → `= $${i}` in PATCH |
| 2 | `server/backend/routes/documents.js` | Move `GET /shares/all` before parameterized routes |
| 3 | `client/src/stores/utilities.js` | Re-throw errors in `action()` wrapper |
| 4 | Already fixed by #3 | — |
| 5 | `server/backend/routes/coordinators.js` | Remove manual BEGIN/COMMIT |
| 6 | `server/backend/routes/documents.js` | Add `document_id` filter to `GET /shares/all` |
| 7 | `server/backend/routes/users.js` | Hash password after user CREATE if provided |
| 8 | `server/backend/services/notification.js` | Wrap in try/catch, don't propagate |
| 9 | `server/backend/services/audit.js` | Wrap in try/catch, don't propagate |
| 10 | `client/src/components/documents/NewFolderModal.jsx` | Remove unused import |
| 13-14 | `server/backend/routes/users.js` | Catch `23514` constraint error |
| 16 | `server/backend/routes/documents.js` | Enrich `GET /shares/all` with JOIN |
| 17 | `server/backend/routes/coordinators.js` | Handle `password` in USER_CREATE execution |
