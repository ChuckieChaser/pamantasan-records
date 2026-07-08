-- ==============================================================================
-- SECTION 6: SYSTEM AUDIT LOGS (The Immutable Ledger)
-- ==============================================================================

-- --- System Domains (Audit Vocabulary) ---
CREATE DOMAIN system_audit_logs_entity_type AS VARCHAR
    CHECK (VALUE IN ('USER', 'DEPARTMENT', 'DOCUMENT', 'DOCUMENT_VERSION', 'DOCUMENT_SHARE', 'DOCUMENT_REQUEST', 'COORDINATOR_REQUEST'));

CREATE DOMAIN system_audit_logs_action AS VARCHAR
    CHECK (VALUE IN ('CREATED', 'UPDATED', 'DELETED', 'APPROVED', 'REJECTED', 'SUSPENDED', 'PUBLISHED', 'UPLOADED'));

-- --- The Audit Trail ---
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NULL REFERENCES users(id) ON DELETE RESTRICT,

    entity_type system_audit_logs_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    action system_audit_logs_action NOT NULL,

    data JSONB NOT NULL,

    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_data ON audit_logs USING GIN (data);

-- --- Row Level Security ---
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_select_access ON audit_logs
    FOR SELECT USING (
        is_system_role()
        OR is_administrator_role()
        OR is_coordinator_role()
    );

CREATE POLICY audit_logs_insert_access ON audit_logs
    FOR INSERT WITH CHECK (
        is_system_role()
        OR (
            actor_id = get_user_current_id()
            OR (actor_id IS NULL AND get_user_current_id() IS NULL)
        )
    );
