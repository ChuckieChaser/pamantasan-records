SET client_min_messages = WARNING;

-- ==============================================================================
-- SECTION 6: SYSTEM AUDIT LOGS (The Immutable Ledger)
-- ==============================================================================

-- REFACTORED: Added DOCUMENT_REQUEST_ATTACHMENT to track the new peer-to-peer sharing system.
CREATE DOMAIN system_audit_logs_entity_type AS VARCHAR
    CHECK (VALUE IN (
        'USER', 'DEPARTMENT', 'DOCUMENT', 'DOCUMENT_VERSION',
        'DOCUMENT_SHARE', 'DOCUMENT_REQUEST', 'DOCUMENT_REQUEST_ATTACHMENT',
        'COORDINATOR_REQUEST'
    ));

-- REFACTORED: Expanded strictly to match logic_flow.md verbs (matching the Notifications enum).
CREATE DOMAIN system_audit_logs_action AS VARCHAR
    CHECK (VALUE IN (
        'CREATED', 'UPDATED', 'DELETED',
        'APPROVED', 'UNAPPROVED', 'REJECTED',
        'UPLOADED', 'SHARED', 'UNSHARED', 'PUBLISHED', 'UNPUBLISHED',
        'ARCHIVED', 'UNARCHIVED', 'RESOLVED', 'COMMENTED', 'ATTACHED',
        'SUSPENDED', 'UNSUSPENDED'
    ));

-- ==============================================================================
-- PHASE 1: SCHEMA CREATION
-- ==============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NULL REFERENCES users(id) ON DELETE RESTRICT,

    entity_type system_audit_logs_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    action system_audit_logs_action NOT NULL,

    data JSONB NOT NULL,

    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
    -- NOTE: No updated_at column intentionally. Audit logs are append-only.
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_data ON audit_logs USING GIN (data);

-- ==============================================================================
-- PHASE 2: ROW LEVEL SECURITY POLICIES
-- ==============================================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

-- Visibility: Only higher-ups can view the ledger.
CREATE POLICY audit_logs_select_access ON audit_logs
    FOR SELECT USING (is_system_role() OR is_administrator_role() OR is_coordinator_role());

-- Insertion: SYSTEM can log anything. Authenticated users can only log actions attributed to themselves.
CREATE POLICY audit_logs_insert_access ON audit_logs
    FOR INSERT WITH CHECK (
        is_system_role() OR
        (actor_id = get_user_current_id() OR (actor_id IS NULL AND get_user_current_id() IS NULL))
    );

-- STRICT ENFORCEMENT: No UPDATE or DELETE policies are created.
-- By default, PostgreSQL denies these actions if RLS is enabled and no policy exists.
