# System Business Logic & Visibility Flow (Server SQL)

After a comprehensive architectural refactor aligning the `/server` SQL files (`00_systems.sql` through `06_audits.sql`) with the `logic_flow.md` master plan, here is the definitive breakdown of the business logic, Row-Level Security (RLS) visibility, and operational flows for the Pamantasan Records Management System.

---

## 1. Core Architecture & Context State (`00_systems.sql`)

The system enforces security natively at the database level using PostgreSQL's `current_setting()` session context (`app.user_current_id`, `app.user_current_department_id`, and `app.user_current_role`).

**Roles Hierarchy & Functions:**

- `SYSTEM`: A background/internal role used by the Node.js server that bypasses standard RLS to execute side-effects (like automated emails or audit generation).
- `ADMINISTRATOR`: The super-user. Has full CRUD access and acts as the universal "Checker" in the Maker-Checker workflow.
- `COORDINATOR`: The "Maker". Has high visibility but is structurally locked out of direct write access to major tables.
- `OFFICER` & `DIRECTOR`: Department-level managers executing the document approval pipeline.
- `MEMBER`: The end-user. Has strictly read-only access to published documents and can request cross-department files via Helpdesk tickets.

---

## 2. Organization & Automated Onboarding (`01_departments.sql` & `02_users.sql`)

### Departments

- **Visibility:** Global (`is_any_role()`). Essential for populating dropdowns across the frontend.
- **Manipulation:** Strictly limited to `ADMINISTRATOR`.

### Users & Identity (The Onboarding Pipeline)

- **Status State Machine:** `PENDING_PASSWORD` ➔ `PENDING_SSO` ➔ `VERIFIED` ➔ `SUSPENDED`.
- **Database Automation:** A native database trigger (`trigger_initialize_user_data`) completely automates the creation of a user's dependencies. The millisecond an `ADMINISTRATOR` inserts a row into `users`, the database seeds `user_credentials` (using `university_id` as the temporary password hash) and `user_settings` natively.
- **Security Isolation:** Users have full autonomy over updating their own `user_credentials` (passwords/Google Auth) and `user_settings` (themes/notifications), but cannot modify their core `users` identity (Role/Department).

---

## 3. The Unified Document Pipeline (`03_documents.sql`)

This is the central nervous system. To ensure complete departmental autonomy, a document itself is a "dumb" container (tracking only if it is globally `is_archived = TRUE`). The strict state machine lives inside the `document_shares` junction table.

### Document Status Lifecycle (Per Department Share)

`PENDING_APPROVAL` ➔ `APPROVED` ➔ `PUBLISHED`

### The Folder Cascade Mechanism

A recursive database CTE (`trigger_cascade_folder_status`) is bound to the `document_shares` table. If a Director updates the status of a folder, the database instantly and invisibly updates the status of all nested child items _belonging to that specific department ID_, leaving other departments untouched.

### Document Visibility (The Core Filter)

To view a document, a user's session must satisfy **one** of these gates:

1. They are an `ADMINISTRATOR` or `COORDINATOR`.
2. The document is **not** `is_archived = TRUE`, **AND**:
    - They are the original `uploader_id` or a previous `rejecter_id`.
    - **Department Pipeline:** The document exists in `document_shares` for their `department_id`, **AND**:
        - `OFFICER`: The share status is `PENDING_APPROVAL`, `APPROVED`, or `PUBLISHED`.
        - `DIRECTOR`: The share status is `APPROVED` or `PUBLISHED`.
        - `MEMBER`: The share status is `PUBLISHED` **AND** (`recipient_id` is NULL or matches their ID).
    - **Ticket Pipeline:** The document exists in `document_request_attachments` linked to an open ticket they requested.

### Document Manipulation (State Transitions)

- `OFFICER` can transition a share between `PENDING_APPROVAL` ⟷ `APPROVED`.
- `DIRECTOR` can transition a share between `APPROVED` ⟷ `PUBLISHED`.

---

## 4. Helpdesk Tickets & The XOR Resolution (`03_documents.sql`)

The system completely isolates the "Department Routing Pipeline" from the "Peer-to-Peer Helpdesk Pipeline."

- **`document_shares` (The Pipeline):** Used exclusively to route documents up the chain of command (`PENDING_APPROVAL` to `PUBLISHED`).
- **`document_request_attachments` (The P2P Bypass):** Solves the XOR constraint. Allows an Admin to grab a file that belongs to the College of Science and securely attach it directly to an HR Member's ticket without sharing it to the entire HR department or ripping it out of its original pipeline.
- **Ticketing Visibility:** `MEMBER`s only see tickets they requested (`requester_id`). Admins and Coordinators see all.

---

## 5. The Maker-Checker Sandbox (`04_coordinators.sql`)

Because `COORDINATOR`s are operational workers but lack executive authority, their entire workflow is sandboxed.

- **Universal JSON Sandbox:** When a Coordinator clicks "Create User," "Delete Document," or "Share File," the action is intercepted. They insert a JSON payload representing their intended action into the `coordinator_requests` table (e.g., `DOCUMENT_UPLOAD`, `USER_CREATE`).
- **The Chat Bypass Exception:** As dictated by the master plan, Coordinators can send ticket messages instantly (`document_request_messages` allows Coordinator inserts), but if they try to attach a file, they are blocked by RLS. They must submit a `DOCUMENT_ATTACH` request for Admin approval.
- **Execution:** The Node.js server executes the payload only after an `ADMINISTRATOR` updates the request status to `APPROVED`.

---

## 6. Notifications, Emails & Immutable Audits (`05_notifications.sql` & `06_audits.sql`)

### Notifications (The Red Bell)

- **Node Automation:** Insertions are entirely restricted to the `SYSTEM` role. When business logic executes in the Node server, the server writes the notification with `is_emailed = FALSE`, triggers Nodemailer, and upon success, flags it `TRUE`.
- **Anti-Spam (`vw_notifications`):** Because the recursive folder cascade could generate 50 simultaneous alerts, the UI relies on a `GROUP BY` View to aggregate identical events (e.g., "Director published 50 items").

### Audits (The Immutable Ledger)

- **True Immutability:** There are zero `UPDATE` or `DELETE` policies on the `audit_logs` table. History cannot be altered.
- **Contextual Narratives:** Uses a `data JSONB` column to store rich JSON payloads summarizing the exact nature of the event, preventing context loss during Maker-Checker approvals.

---

## 7. Summary of Hard-Enforced Database Protections

1. **Officers approving a Published Document:** Blocked by `documents_update_access` (requires `status IN ('PENDING_APPROVAL', 'APPROVED')`).
2. **Members viewing Drafts:** Blocked by `documents_select_access` (requires `status = 'PUBLISHED'`).
3. **Coordinators altering the pipeline directly:** Blocked by omission in `document_shares_insert_access`, and `document_request_attachments_insert_access` (forcing them to the Maker-Checker queue). *Note: Coordinators are explicitly allowed to natively upload physical documents without a Maker-Checker request because uploaded files are invisible until a Share record is explicitly created.*
4. **Directors sharing outside their department:** Blocked by `document_shares_insert_access` (requires `department_id = get_user_current_department_id()`).
5. **Orphaned User Settings:** Blocked by `trigger_initialize_user_data` (guarantees credentials and settings exist for every user).
6. **Attachment Conflict:** Blocked by structurally splitting `document_shares` and `document_request_attachments` into dedicated tables.
