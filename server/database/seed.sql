-- ==============================================================================
-- SEED DATA
-- Test users for development and pipeline testing.
--
-- Password for ALL users: "password"
-- (The auth route currently compares against the literal string "password" for dev phase)
--
-- DEPARTMENTS
--   - College of Computer Studies (CCS) — primary department, holds 5 users for full pipeline testing
--   - Human Resources (HR) — secondary department, holds 2 members for document request testing
--
-- HOW TO RUN:
--   Connect to the pamantasan_records database as admin (or a SYSTEM role session)
--   and execute this entire file.
--   psql -h 127.0.0.1 -p 5433 -U admin -d pamantasan_records -f seed.sql
--
-- NOTE: This seed bypasses RLS by using a raw INSERT. The app backend sets
--       RLS context per-request via SET LOCAL — seed data is inserted once
--       at the DB level with no app.user_current_role session variable,
--       so policies don't apply here.
-- ==============================================================================

-- ==============================================================================
-- 1. DEPARTMENTS
-- ==============================================================================

INSERT INTO departments (id, name, code) VALUES
    ('d0000001-0000-4000-8000-000000000001', 'College of Computer Studies', 'CCS'),
    ('d0000001-0000-4000-8000-000000000002', 'Human Resources',             'HR')
ON CONFLICT (code) DO NOTHING;

-- ==============================================================================
-- 2. USERS (CCS — 5 roles for document pipeline approval flow)
-- ==============================================================================
-- Document Pipeline:
--   Coordinator uploads -> Officer approves (PENDING_OFFICER -> PENDING_DIRECTOR)
--   -> Director publishes (PENDING_DIRECTOR -> PUBLISHED)
--   -> Member views (PUBLISHED)
--   Administrator oversees all.

INSERT INTO users (id, university_id, department_id, role, email, first_name, middle_name, last_name, status) VALUES
    -- Administrator: oversees everything, can manage users & departments
    ('u1000001-0000-4000-8000-000000000001',
     '20-00001',
     'd0000001-0000-4000-8000-000000000001',
     'ADMINISTRATOR',
     'admin.ccs@university.edu.ph',
     'Arthur', NULL, 'Pendragon',
     'VERIFIED'),

    -- Coordinator: uploads documents, submits requests
    ('u1000001-0000-4000-8000-000000000002',
     '20-00002',
     'd0000001-0000-4000-8000-000000000001',
     'COORDINATOR',
     'coord.ccs@university.edu.ph',
     'Cora', NULL, 'Smith',
     'VERIFIED'),

    -- Director: final publisher (PENDING_DIRECTOR → PUBLISHED)
    ('u1000001-0000-4000-8000-000000000003',
     '20-00003',
     'd0000001-0000-4000-8000-000000000001',
     'DIRECTOR',
     'director.ccs@university.edu.ph',
     'Diana', NULL, 'Prince',
     'VERIFIED'),

    -- Officer: first approver (PENDING_OFFICER → PENDING_DIRECTOR)
    ('u1000001-0000-4000-8000-000000000004',
     '20-00004',
     'd0000001-0000-4000-8000-000000000001',
     'OFFICER',
     'officer.ccs@university.edu.ph',
     'Oliver', NULL, 'Queen',
     'VERIFIED'),

    -- Member (CCS): views published documents and submits document requests
    ('u1000001-0000-4000-8000-000000000005',
     '20-00005',
     'd0000001-0000-4000-8000-000000000001',
     'MEMBER',
     'member.ccs@university.edu.ph',
     'Marcus', NULL, 'Aurelius',
     'VERIFIED')

ON CONFLICT (university_id) DO NOTHING;

-- ==============================================================================
-- 3. USERS (HR — 2 members for document request testing from outside CCS)
-- ==============================================================================

INSERT INTO users (id, university_id, department_id, role, email, first_name, middle_name, last_name, status) VALUES
    -- HR Member 1: requests documents from CCS
    ('u1000001-0000-4000-8000-000000000006',
     '21-00001',
     'd0000001-0000-4000-8000-000000000002',
     'MEMBER',
     'member1.hr@university.edu.ph',
     'Helena', NULL, 'Roosevelt',
     'VERIFIED'),

    -- HR Member 2: second requester for multi-thread testing
    ('u1000001-0000-4000-8000-000000000007',
     '21-00002',
     'd0000001-0000-4000-8000-000000000002',
     'MEMBER',
     'member2.hr@university.edu.ph',
     'Henry', NULL, 'Wallace',
     'VERIFIED')

ON CONFLICT (university_id) DO NOTHING;

-- ==============================================================================
-- 4. USER CREDENTIALS
-- All passwords are the literal string "password" for dev phase.
-- TODO: Replace with bcrypt hashes before any real user onboarding.
-- ==============================================================================

INSERT INTO user_credentials (user_id, password_hash) VALUES
    ('u1000001-0000-4000-8000-000000000001', 'password'),
    ('u1000001-0000-4000-8000-000000000002', 'password'),
    ('u1000001-0000-4000-8000-000000000003', 'password'),
    ('u1000001-0000-4000-8000-000000000004', 'password'),
    ('u1000001-0000-4000-8000-000000000005', 'password'),
    ('u1000001-0000-4000-8000-000000000006', 'password'),
    ('u1000001-0000-4000-8000-000000000007', 'password')
ON CONFLICT (user_id) DO NOTHING;

-- ==============================================================================
-- 5. USER SETTINGS (defaults for each user)
-- ==============================================================================

INSERT INTO user_settings (user_id, theme, notification, animation) VALUES
    ('u1000001-0000-4000-8000-000000000001', 'SYSTEM', 'ALL', TRUE),
    ('u1000001-0000-4000-8000-000000000002', 'DARK',   'ALL', TRUE),
    ('u1000001-0000-4000-8000-000000000003', 'SYSTEM', 'ALL', TRUE),
    ('u1000001-0000-4000-8000-000000000004', 'DARK',   'ALL', TRUE),
    ('u1000001-0000-4000-8000-000000000005', 'SYSTEM', 'ALL', TRUE),
    ('u1000001-0000-4000-8000-000000000006', 'SYSTEM', 'ALL', TRUE),
    ('u1000001-0000-4000-8000-000000000007', 'DARK',   'ALL', TRUE)
ON CONFLICT (user_id) DO NOTHING;

-- ==============================================================================
-- SUMMARY (for reference)
-- ==============================================================================
--
--  UNIVERSITY_ID | EMAIL                           | ROLE          | DEPT
-- ---------------+---------------------------------+---------------+------
--  20-00001      | admin.ccs@university.edu.ph     | ADMINISTRATOR | CCS
--  20-00002      | coord.ccs@university.edu.ph     | COORDINATOR   | CCS
--  20-00003      | director.ccs@university.edu.ph  | DIRECTOR      | CCS
--  20-00004      | officer.ccs@university.edu.ph   | OFFICER       | CCS
--  20-00005      | member.ccs@university.edu.ph    | MEMBER        | CCS
--  21-00001      | member1.hr@university.edu.ph    | MEMBER        | HR
--  21-00002      | member2.hr@university.edu.ph    | MEMBER        | HR
--
--  PASSWORD (all): password
-- ==============================================================================
