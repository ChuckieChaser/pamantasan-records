# Pamantasan Records Management System: Master Blueprint

This document serves as the master architectural plan and business logic flow for the system. All client interfaces and backend databases must adhere strictly to these defined rules.

---

## 1. System Architecture

The system utilizes a physically decoupled two-node structure:

- **Client (Laptop A):** Hosts the frontend React application.
- **Server (Laptop B):** Hosts the Node.js backend, PostgreSQL database, local physical storage (D: Drive), and a locally installed AI engine for semantic extraction and summarization.

The nodes communicate via a local LAN or Wireless network.

---

## 2. Role-Based Access Control (RBAC)

The system enforces a strict 5-tier hierarchical role structure:

1. **Administrator:** The super-user. Has full CRUD access and acts as the ultimate "Checker" for any sandboxed requests.
2. **Coordinator:** The "Maker". Executes daily operational tasks (uploads, sharing, user creation) but requires Administrator approval for any database mutations.
3. **Officer:** The Department Approver. First gatekeeper in the document pipeline. Can approve, unapprove, reject,, request, view, and download.
4. **Director:** The Department Publisher. Final gatekeeper in the document pipeline. Can publish, unpublish, request, view, and download.
5. **Member:** The End-User. Has read-only access to published documents and can request restricted files via the Helpdesk.

---

## 3. The Identity & Onboarding Pipeline

User creation triggers an automated, strict state-machine workflow.

### User Creation

1. An Administrator (or Coordinator, pending Admin approval) fills out the user creation form.
2. **Database Automation:** The creation of a user inherently triggers the automated generation of their `user_credentials` and `user_settings` rows. The temporary password defaults to the `university_id`.
3. An audit log is generated, and a welcome email containing their credentials is dispatched by the Node server.

### The Status State Machine

Users must traverse the following pipeline before accessing the system:

- **`PENDING_PASSWORD`:** (Default). The user logs in and is immediately forced to change their password.
- **`PENDING_SSO`:** The user must link their account to Google Authenticator (MFA) and verify their email.
- **`VERIFIED`:** Onboarding complete. The user is granted standard access based on their role.
- **`SUSPENDED`:** An Administrator can manually trigger this state to immediately revoke system access due to malicious or suspicious activity.

Users have full autonomy over their personal settings and credentials, but cannot alter their core identity (Role/Department).

---

## 4. The Document State Machine (Independent Pipelines)

Documents are structural containers. They do not possess a single global status. Instead, the state machine (`PENDING_APPROVAL` -> `PUBLISHED`) lives within the `document_shares` table. This guarantees that if a file is shared to multiple departments, each department has absolute autonomy over their own approval and publishing timeline without affecting the others.

### 4.1 Upload & AI Processing

- Only Administrators and Coordinators can create folders or upload files.
- **Initial State:** A newly created document implicitly exists in an `UPLOADED` state. (It is invisible to all departments until a share record is explicitly created).
- **Obfuscation:** Files saved to physical storage are renamed to match the `document_versions` UUID (not the `documents` UUID) to ensure version history continuity.
- **AI Integration:** Upon upload, the local AI extracts the document text, generates a summary, and creates an embedding vector.
- **Versioning:** Re-uploading an existing file prompts Replace, Continue, or Skip. This current and the new version is then extracted by the local AI to generate change summary
    - **Replace:** Creates a new row in `document_versions`. Users can revert to previous versions via the Inspector UI.
    - **Continue:** Uploads as a new document with a suffix (e.g., `filename (1).pdf`).
    - **Skip:** Cancels the upload.

### 4.2 The Department Routing Workflow

When a document is shared to a department, a new row in `document_shares` is created. This isolated row traverses the following statuses:

1. **`PENDING_APPROVAL` (Officer):** Visible to Officers in the target department.
    - _Action:_ Officer can **Approve** (moves share to `APPROVED`) or **Reject** (Deletes the share and logs the rejection).
2. **`APPROVED` (Director):** Visible to Directors in the target department.
    - _Action:_ Director can **Publish** (moves share to `PUBLISHED`) or **Unpublish** (reverts share to `APPROVED`).
3. **`PUBLISHED` (Member):** Visible to end-users in that specific department.
    - _Visibility Scope:_ If the share's `recipient_id` is NULL, the entire department sees it. If a specific UUID is provided, only that user sees it.
4. **`ARCHIVED` (Global Terminal State):** Admin/Coordinator can mark the physical document as `is_archived = TRUE`. This immediately hides it from all departments regardless of their share status. From here, it can be permanently deleted.

### 4.3 The Folder Cascade Rule

Folders act as UI navigational views. If a Director publishes a folder, the database automatically cascades that exact status change down through all nested child files **specifically for that department's share**. It will not alter the status of those child files in other departments.

---

## 5. Helpdesk Tickets (The Peer-to-Peer Bypass)

To resolve the XOR constraint between department routing and private ticketing, the system utilizes two distinctly separate routing tables.

- **Department Routing (`document_shares`):** Handles the standard pipeline (`PENDING_APPROVAL` -> `PUBLISHED`).
- **Helpdesk Bypass (`document_request_attachments`):** Handles peer-to-peer file sharing.
    - An Officer, Director or a Member submits a ticket for a restricted file.
    - Administrators/Coordinators interface with the ticket via a chat thread.
    - An Admin can securely attach **any** document to the ticket. This grants the requesting Member isolated, read-only access to that specific file without removing the document from its original department pipeline or altering its core status.

---

## 6. The Maker-Checker Sandbox (Coordinator Workflow)

Because Coordinators lack executive authority, their database write privileges are fundamentally sandboxed.

- **The Intercept:** When a Coordinator attempts a major action (User Create, Document Share, Delete, Archive), the system intercepts the action.
- **The Payload:** The intended action is packaged into a JSON object and inserted into the `coordinator_requests` table with a status of `PENDING`.
- **The Exception (Chatting):** Coordinators may send text messages in Helpdesk tickets instantly. However, attempting to _attach_ a file to a ticket triggers the sandbox intercept.
- **Execution:** An Administrator reviews the queue. Only upon clicking "Approve" does the Node server execute the JSON payload and mutate the actual system data.

---

## 7. System Side-Effects (Notifications & Audits)

These actions are handled entirely by the Node.js Server (acting as the `SYSTEM` role).

### Notifications (The Inbox)

- Major status changes immediately generate a notification for the affected parties.
- **Email Bridge:** The server dispatches an email. Upon SMTP success, the notification is marked `is_emailed = TRUE`.
- **Anti-Spam Aggregation:** To prevent inbox flooding during bulk folder cascades, the UI relies on an aggregated database View to group identical events (e.g., _"Director published 50 items in Project Folder"_).

### Audit Logs (The Immutable Ledger)

- Every major state change, login, and Maker-Checker execution is permanently recorded.
- **Immutability:** The audit log table lacks `UPDATE` or `DELETE` permissions. History cannot be altered by any role, including Administrators.
- **Context Preservation:** Logs utilize a JSON payload to store rich narrative data about the event, ensuring full forensic reconstructability.
