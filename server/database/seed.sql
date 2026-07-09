SET client_min_messages = WARNING;

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
-- ==============================================================================

-- ==============================================================================
-- 1. DEPARTMENTS
-- ==============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user WITH NOLOGIN;
    END IF;
END
$$;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_user;

INSERT INTO departments (id, name, code) VALUES
    ('d0000001-0000-4000-8000-000000000001', 'College of Computer Studies', 'CCS'),
    ('d0000001-0000-4000-8000-000000000002', 'Human Resources',             'HR')
ON CONFLICT (code) DO NOTHING;

-- ==============================================================================
-- 2. USERS (CCS — 5 roles for document pipeline approval flow)
-- NOTE: Inserting these will automatically trigger the creation of user_credentials and user_settings.
-- ==============================================================================
INSERT INTO users (id, university_id, department_id, role, email, first_name, middle_name, last_name, status) VALUES
    -- Administrator: oversees everything, can manage users & departments
    ('f1000001-0000-4000-8000-000000000001', '20-00001', 'd0000001-0000-4000-8000-000000000001', 'ADMINISTRATOR', 'admin.ccs@university.edu.ph', 'Arthur', NULL, 'Pendragon', 'VERIFIED'),
    -- Coordinator: uploads documents, submits requests
    ('f1000001-0000-4000-8000-000000000002', '20-00002', 'd0000001-0000-4000-8000-000000000001', 'COORDINATOR', 'coord.ccs@university.edu.ph', 'Cora', NULL, 'Smith', 'VERIFIED'),
    -- Director: final publisher (APPROVED → PUBLISHED)
    ('f1000001-0000-4000-8000-000000000003', '20-00003', 'd0000001-0000-4000-8000-000000000001', 'DIRECTOR', 'director.ccs@university.edu.ph', 'Diana', NULL, 'Prince', 'VERIFIED'),
    -- Officer: first approver (PENDING_APPROVAL → APPROVED)
    ('f1000001-0000-4000-8000-000000000004', '20-00004', 'd0000001-0000-4000-8000-000000000001', 'OFFICER', 'officer.ccs@university.edu.ph', 'Oliver', NULL, 'Queen', 'VERIFIED'),
    -- Member (CCS): views published documents and submits document requests
    ('f1000001-0000-4000-8000-000000000005', '20-00005', 'd0000001-0000-4000-8000-000000000001', 'MEMBER', 'member.ccs@university.edu.ph', 'Marcus', NULL, 'Aurelius', 'VERIFIED')
ON CONFLICT (university_id) DO NOTHING;

-- ==============================================================================
-- 3. USERS (HR — 2 members for document request testing from outside CCS)
-- ==============================================================================
INSERT INTO users (id, university_id, department_id, role, email, first_name, middle_name, last_name, status) VALUES
    -- HR Member 1: requests documents from CCS
    ('f1000001-0000-4000-8000-000000000006', '21-00001', 'd0000001-0000-4000-8000-000000000002', 'MEMBER', 'member1.hr@university.edu.ph', 'Helena', NULL, 'Roosevelt', 'VERIFIED'),
    -- HR Member 2: second requester for multi-thread testing
    ('f1000001-0000-4000-8000-000000000007', '21-00002', 'd0000001-0000-4000-8000-000000000002', 'MEMBER', 'member2.hr@university.edu.ph', 'Henry', NULL, 'Wallace', 'VERIFIED')
ON CONFLICT (university_id) DO NOTHING;

-- ==============================================================================
-- 4. USER CREDENTIALS (REFACTORED TO UPDATE)
-- The trigger mapped the password to the university_id. This overrides it for dev.
-- ==============================================================================
UPDATE user_credentials SET password_hash = 'password' WHERE user_id IN (
    'f1000001-0000-4000-8000-000000000001',
    'f1000001-0000-4000-8000-000000000002',
    'f1000001-0000-4000-8000-000000000003',
    'f1000001-0000-4000-8000-000000000004',
    'f1000001-0000-4000-8000-000000000005',
    'f1000001-0000-4000-8000-000000000006',
    'f1000001-0000-4000-8000-000000000007'
);

-- ==============================================================================
-- 5. USER SETTINGS (REFACTORED TO UPDATE)
-- The trigger set default theme to SYSTEM. This updates specific users to DARK.
-- ==============================================================================
UPDATE user_settings SET theme = 'DARK' WHERE user_id IN (
    'f1000001-0000-4000-8000-000000000002', -- Coordinator
    'f1000001-0000-4000-8000-000000000004', -- Officer
    'f1000001-0000-4000-8000-000000000007'  -- HR Member 2
);
