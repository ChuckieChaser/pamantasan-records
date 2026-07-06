# Pamantasan Records — Full Refactor & Feature Build

## Overview

The codebase has two parallel "worlds" that need unifying:

1. **`App.jsx`** — a monolithic 869-line file containing all pages, layouts, and routing inline. It has its own login, pages, and layout that were written separately from the organized component system.
2. **`src/layouts/` + `src/pages/` + `src/components/`** — a well-structured system with a real component library (`Buttons`, `Textfields`, `Badges`, `Menus`, etc.), but pages are empty stubs and the layouts use a hardcoded `usersData[0]` as the current user.

The `App.jsx` monolith must be dismantled into the proper structure. All pages get built with the existing component system (not ad-hoc Tailwind). The goal is a complete, working mock-first application that follows the business logic from the SQL schemas.

---

## Key Business Logic (from server SQL)

### Roles
`ADMINISTRATOR` → `COORDINATOR` → `DIRECTOR` → `OFFICER` → `MEMBER`

### Dissemination Flow (document lifecycle)
```
Admin/Coordinator uploads → UPLOADED
Admin shares to dept    → PENDING_OFFICER
Officer approves        → PENDING_DIRECTOR
Director publishes      → PUBLISHED
Members (or select)    → can read
Any approver           → can REJECT (returns to uploader)
```

### Document Request (Helpdesk/Ticketing)
- Requesters: DIRECTOR, OFFICER, MEMBER (not ADMIN/COORDINATOR)
- Respondents: ADMINISTRATOR or COORDINATOR
- Two-way chat thread per ticket
- Admin/Coordinator attaches files; marks ticket RESOLVED
- Requester can delete OPEN tickets

### Coordinator Maker-Checker
- Coordinators submit `coordinator_requests` for privileged actions
- Administrator reviews (APPROVED / REJECTED)

### Login (Mock — quick-access role buttons)
- No real auth flow for now; show `Login as {Role}` buttons for all 6 mock users
- After login, respect the user's role for access control

---

## Inconsistencies & Issues Found

| Area | Issue |
|------|-------|
| `App.jsx` | 869-line monolith — all pages live here, duplicating the proper `src/pages/` structure |
| `MainLayout.jsx` | Imports `usersData[0]` hardcoded — not using `useAuthentication` store |
| `Login.jsx` (pages) | Is a component showcase, not a real login page |
| `stores/index.js` | Exports `useUserSetting` but `App.jsx` imports it as `useUserSetting` — some are aliased differently |
| `App.jsx` stores | Imports `useCoordinatorRequest` as `useCoordinatorRequest`, `useAuditLog` but store file is `useCoordinator` / `useAudit` — mismatch |
| Document status in forms | `DocumentsPage` in App.jsx uses `'ACTIVE'` and `'DEACTIVATED'` as status values — these don't exist in the SQL domain |
| Request form field | Uses `document_name` + `notes` but schema has `subject` |
| `document_request_messages` store | Missing from `stores/index.js` — only `useMessage` is exported but App imports nothing for it |
| `Badges.jsx` | References `border-success-border`, `border-warning-border`, `border-error-border` — these CSS tokens don't exist in `index.css` |

---

## Proposed Changes

### 1. CSS Token Fix
#### [MODIFY] [index.css](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/index.css)
- Add missing border tokens: `--color-success-border`, `--color-warning-border`, `--color-error-border` for both light and dark modes.

---

### 2. Login Page — Role Quick-Access
#### [MODIFY] [Login.jsx](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/pages/Login.jsx)
Replace the component showcase with a proper login page:
- Logo + "Records Management Office" title
- 6 role buttons: `Login as Administrator`, `Login as Coordinator`, `Login as Director`, `Login as Officer`, `Login as Member (CCS)`, `Login as Member (HR)`
- Each maps to the corresponding mock user ID
- Uses the `useAuthentication` store's `login()` action (by university ID lookup)

---

### 3. Authentication Layout
#### [MODIFY] [AuthenticationLayout.jsx](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/layouts/AuthenticationLayout.jsx)
- Remove stale comments, apply clean centered layout

---

### 4. Main Layout — Wire up Authentication
#### [MODIFY] [MainLayout.jsx](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/layouts/MainLayout.jsx)
- Remove the hardcoded `usersData[0]` import
- Use `useAuthentication` to get `user`
- Pass `user` to `Sidebar`
- Add `logout` action to sidebar bottom avatar area

---

### 5. Sidebar — Role-based Navigation & Logout
#### [MODIFY] [Sidebar.jsx](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/components/layout/Sidebar.jsx)
- Wire `logout` from `useAuthentication`
- Role-based nav: Admin/Coordinator see Management; Director/Officer/Member see Requests
- Add logout `NavigationButton` at the bottom using `LogOut` icon

---

### 6. Topbar — Wire Notifications
#### [MODIFY] [Topbar.jsx](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/components/layout/Topbar.jsx)
- Wire `useNotification` store to show real notification count + list
- Use the existing `NotificationMenu` component from `Menus.jsx`

---

### 7. App.jsx → Routing-only File
#### [MODIFY] [App.jsx](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/App.jsx)
- Strip ALL page/component/layout code from App.jsx
- Only keep `BrowserRouter`, `Routes`, `ProtectedRoute`, and route declarations
- Import pages from `./pages` and layouts from `./layouts`

---

### 8. Dashboard Page
#### [MODIFY] [Dashboard.jsx](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/pages/Dashboard.jsx)
Pull the `DashboardPage` logic from `App.jsx` into this file, refactored:
- Welcome header with user name
- Quick Access (4 recent documents)
- 3 metric cards (Total Docs, Pending Approvals, Open Tickets)
- Split view: Shared with Department + Recent System Activity
- Use `Card`, `CardHeader`, `CardBody` components
- Filter metrics by role appropriately

---

### 9. Documents Page — Full Dissemination UI
#### [MODIFY] [Documents.jsx](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/pages/Documents.jsx)
This is the most complex page. Role-gated views:

**Admin/Coordinator view:**
- File/folder browser with breadcrumb navigation
- Upload button (opens modal: name, is_folder, comment, summary)
- Share button on each document (opens dept share modal)
- Status badge for each document
- Approve/Reject actions visible when doc is PENDING

**Officer view:**
- Shows documents shared with their department at `PENDING_OFFICER` or `PUBLISHED`
- Approve button → moves to `PENDING_DIRECTOR`
- Reject button → opens rejection reason modal

**Director view:**
- Shows `PENDING_DIRECTOR` and `PUBLISHED` docs for their dept
- Publish button → moves to `PUBLISHED`
- Reject button → opens rejection reason modal

**Member view:**
- Shows only `PUBLISHED` docs shared with their dept (or specifically to them)
- Read-only

All views share a detail inspector panel (right side) that opens when a document is selected.

---

### 10. Archives Page
#### [MODIFY] [Archives.jsx](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/pages/Archives.jsx)
Pull the `ArchivesPage` logic from `App.jsx`, refactored:
- Table of archived docs
- Admin can restore or permanently delete
- Uses `Card` + `Badge` components

---

### 11. Management Page — Admin/Coordinator Only
#### [MODIFY] [Management.jsx](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/pages/Management.jsx)
Pull the `ManagementPage` logic from `App.jsx`, refactored:

**Users tab:**
- Table of all users with role badge, status badge, department
- "Add User" button → modal with: university_id, first_name, middle_name (optional), last_name, email, role, department_id
- Per-row action menu: Suspend, Edit

**Departments tab:**
- Table of departments (code, name)
- Admin-only: "Add Department" button

**Coordinator Requests tab (Admin only):**
- Pending coordinator_requests queue
- Approve / Reject with reason modal

---

### 12. Requests Page — Helpdesk Ticketing
#### [MODIFY] [Requests.jsx](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/pages/Requests.jsx)
Pull the `RequestPage` logic from `App.jsx`, heavily refactored:

**Non-Admin/Coordinator (Requester) view:**
- List of own tickets with status badge
- "New Request" button → modal with `subject` field
- Click ticket → opens chat thread view (messages + input)
- Can delete OPEN tickets

**Admin/Coordinator (Resolver) view:**
- List of ALL open tickets
- Click ticket → full chat thread
- Can send messages AND attach a document (from workspace)
- "Mark Resolved" button

---

### 13. Store: `useAuthentication` — Login by Role
#### [MODIFY] [useAuthentication.js](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/stores/authentication/useAuthentication.js)
- Update `login()` to accept a `userId` directly (for mock quick-login by mock user ID)
- `bypass()` can be kept but used internally

---

### 14. Store: `useNotification` — Wire unread count
#### [MODIFY] [useNotification.js](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/stores/notification/useNotification.js)
- Add `unreadCount` computed from `notifications.filter(n => !n.is_read).length`

---

### 15. Store: `useMessage` — Rename export for clarity
#### [MODIFY] [useMessage.js](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/stores/document/useMessage.js)
- Verify the export name matches `stores/index.js` (`useDocumentRequestMessage`)

---

### 16. Stores `index.js` — Fix naming
#### [MODIFY] [stores/index.js](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/stores/index.js)
- Verify all exported names match what `App.jsx` currently calls
- Rename `useCoordinator` → check export is `useCoordinatorRequest`
- Rename `useAudit` → check export is `useAuditLog`

---

### 17. `document_requests` schema alignment
#### [MODIFY] [mock data/documents.js](file:///c:/Users/Chuckie/Documents/CodingProjects/pamantasan-records/client/src/mocks/data/documents.js)
- Already uses correct `subject` field — no change needed

#### [MODIFY] mock service create
- Already defaults to `DOCUMENT_REQUESTS_STATUS.OPEN` — no change needed

---

## Coding Standards Applied Throughout

| Rule | Application |
|------|-------------|
| No abbreviations | Variables spelled out fully; `map((v) ...)` only in short anonymous callbacks where first letter is clear |
| One-liner limit | 2+ expressions always drop to multi-line |
| Comment dividers | `// --- TITLE ---` used consistently before all logical groups |
| No over-abstraction | First-level abstraction only: pages use stores, stores use services, services use mock/API |
| Consistent naming | `useDocumentRequest`, `useDocumentShare`, `useCoordinatorRequest`, `useAuditLog` — uniform across files |
| Component reuse | All UI via `Buttons`, `Badges`, `Textfields`, `Containers`, `Menus` — no ad-hoc Tailwind |

---

## Open Questions

> [!IMPORTANT]
> **Q1**: Should the Documents page have a folder-tree view (navigating into folders) or a flat list with a "parent" indicator? The SQL supports nested folders via `parent_id`.

> [!IMPORTANT]
> **Q2**: The `MainLayout.jsx` has an `isInspectorOpen` panel (right side). Should the document detail inspector remain global (shared across Dashboard/Documents/Archives as in `App.jsx`) or should it be local to each page?

> [!NOTE]
> **Q3**: The Coordinator's "Maker-Checker" queue — should Coordinators see a dedicated UI for submitting requests (like a form that creates a `coordinator_request`), or is that out of scope for this phase?

---

## Verification Plan

### Manual Verification
- Run `npm run dev` in `/client`
- Log in as each of the 6 roles and verify:
  - Role-gated navigation items appear/disappear correctly
  - Admin can upload, share, and see all documents
  - Officer sees PENDING_OFFICER docs and can approve/reject
  - Director sees PENDING_DIRECTOR docs and can publish/reject
  - Member sees only PUBLISHED docs
  - Director/Officer/Member can create requests and chat
  - Admin/Coordinator see all tickets and can respond + resolve
