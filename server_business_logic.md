# System Business Logic & Visibility Flow (Server SQL)

After a comprehensive, line-by-line review of all SQL files in the `/server` directory (`00_systems.sql` through `06_audits.sql`), here is the detailed breakdown of the business logic, Row-Level Security (RLS) visibility, and operational flows for the Pamantasan Records Management System.

---

## 1. Core Architecture & System Context (`00_systems.sql`)

The system relies heavily on PostgreSQL's `current_setting()` to establish the session context (`app.user_current_id`, `app.user_current_department_id`, and `app.user_current_role`). 

**Roles Hierarchy & Functions:**
- `SYSTEM`: A background/internal role that bypasses almost all RLS.
- `ADMINISTRATOR`: The super-user. Has full CRUD access to almost all operational data.
- `COORDINATOR`: The "Maker" in the Maker-Checker system. Has high visibility but restricted write access.
- `DIRECTOR` & `OFFICER`: Department-level managers. Have scoped write access to documents in their approval pipeline.
- `MEMBER`: The end-user. Has read-only access to published documents and can create helpdesk requests.

---

## 2. Organization & User Management (`01_departments.sql` & `02_users.sql`)

### Departments
- **Visibility (Select):** Global. Any role can see the list of departments.
- **Manipulation (Insert/Update/Delete):** Strictly limited to `ADMINISTRATOR`.

### Users & Identity
- **Visibility:** Any logged-in user can view the basic user registry (name, email, role, department).
- **Manipulation:** Only `ADMINISTRATOR` can create or modify users. 
- **Security Isolation:**
  - `user_credentials`: Only `SYSTEM` can read password hashes. Users can only update their own credentials (or `ADMINISTRATOR` can force an insert).
  - `user_settings` & `user_sessions`: Users can read/update/delete their own settings and sessions. `ADMINISTRATOR` can force-delete sessions (kick users).

---

## 3. The Unified Document Pipeline (`03_documents.sql`)

This is the most complex part of the system. A document is not just a file; it represents a state machine.

### Document Status Lifecycle
`UPLOADED` ➔ `PENDING_OFFICER` ➔ `PENDING_DIRECTOR` ➔ `PUBLISHED` (or `ARCHIVED` / `ATTACHMENT`)

### Document Visibility (The `documents_select_access` Policy)
To see a document, a user must meet **one** of these conditions:
1. They are an `ADMINISTRATOR`.
2. The document is **not** `ARCHIVED`, **AND**:
   - They are the `uploader_id` (the person who uploaded it).
   - They are the `rejecter_id` on any of its past versions (they reviewed it previously).
   - **Department Routing:** The document has a `document_shares` record matching their `department_id`, **AND**:
     - If `OFFICER`: Status is `PENDING_OFFICER`, `PENDING_DIRECTOR`, or `PUBLISHED`.
     - If `DIRECTOR`: Status is `PENDING_DIRECTOR` or `PUBLISHED`.
     - If `MEMBER`: Status is `PUBLISHED` **AND** (`recipient_id` is null OR matches their user ID).
   - **Ticket Routing:** The document status is `ATTACHMENT`, and it is shared via a `document_request_id` that the user originally requested.

### Document Manipulation (Insert / Update / Delete)
- **Insert / Delete:** ONLY `ADMINISTRATOR` (and `SYSTEM`). *Note: Coordinators cannot directly insert documents; they must go through the Maker-Checker queue.*
- **Update (State Transitions):**
  - `ADMINISTRATOR` can update anything.
  - `OFFICER` can update **only if** the document is shared to their department AND the status is exactly `PENDING_OFFICER`.
  - `DIRECTOR` can update **only if** the document is shared to their department AND the status is exactly `PENDING_DIRECTOR`.

### Document Routing (`document_shares`)
A share record connects a document to an audience. It has a strict constraint: it must have EITHER a `department_id` (Department Pipeline) OR a `document_request_id` (Helpdesk Ticket Pipeline), never both.
- **Insert/Update/Delete Shares:** `ADMINISTRATOR` can route anything. Interestingly, `OFFICER` and `DIRECTOR` are also allowed to insert/update/delete shares **for their own department**.

---

## 4. Helpdesk Tickets (`document_requests` & `document_request_messages`)

- **Visibility:** `ADMINISTRATOR` and `COORDINATOR` can see **all** tickets. Regular users (Directors, Officers, Members) can only see tickets where they are the `requester_id`.
- **Creation:** Any user who is **not** an Admin or Coordinator can create a ticket.
- **Messages:** Only the requester or an `ADMINISTRATOR` can post messages to an `OPEN` ticket.
- *Logic Flow:* A Member requests a document ➔ Coordinator sees it, drafts the document, submits a Coordinator Request ➔ Admin approves the Coordinator Request ➔ Document is created as an `ATTACHMENT` and shared directly to the Member's ticket ➔ Admin resolves the ticket.

---

## 5. The Maker-Checker System (`04_coordinators.sql`)

Because `COORDINATOR`s are operational workers but lack full trust, they operate in a sandbox.

- **Visibility:** `ADMINISTRATOR` can see all requests. A `COORDINATOR` can only see their own requests (`requester_id`).
- **Creation:** A `COORDINATOR` inserts a JSON payload representing their intended action (e.g., `DOCUMENT_UPLOAD`, `USER_CREATE`).
- **Execution:** The server does not execute this automatically. An `ADMINISTRATOR` must review the payload and update the status to `APPROVED` or `REJECTED`. 
- *Logic Flow:* This perfectly explains why the `Inspector.jsx` UI allows Coordinators to click "Share" or "Archive" but routes those actions to a pending queue instead of mutating the document directly.

---

## 6. Notifications & Audits (`05_notifications.sql` & `06_audits.sql`)

### Notifications (The Inbox)
- Entirely managed by the `SYSTEM` role. 
- Users can only `SELECT` and `UPDATE` (mark as read) notifications where they are the `recipient_id`.
- The system includes a View (`vw_notifications`) that groups similar events together to avoid inbox spam.

### Audits (The Ledger)
- **Visibility:** `ADMINISTRATOR` and `COORDINATOR` can read the audit logs.
- **Immutability:** There is no `UPDATE` or `DELETE` policy. Once written, it is permanent.
- **Insertion:** Users log their own actions (e.g., "I clicked approve"), or the `SYSTEM` logs automated actions.

---

## Summary of Misalignments Prevented by RLS

1. **Officers trying to approve a Published Document:** Prevented by `documents_update_access` (requires `status = 'PENDING_OFFICER'`).
2. **Members trying to see Drafts:** Prevented by `documents_select_access` (requires `status = 'PUBLISHED'`).
3. **Coordinators trying to upload directly:** Prevented by `documents_insert_access` (requires `ADMINISTRATOR` or `SYSTEM`).
4. **Directors sharing outside their department:** Prevented by `document_shares_insert_access` (requires `department_id = get_user_current_department_id()`).

> [!NOTE]
> The database schema and RLS policies are extremely robust and act as a hard wall against UI mistakes. The logic we implemented in the React client perfectly mirrors these backend rules.
