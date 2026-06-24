-- ==============================================================================
-- SECTION 6: SYSTEM AUDIT LOGS (The Immutable Ledger)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 6.0: System Domains (Audit Vocabulary)
-- ------------------------------------------------------------------------------
-- Defines the critical business entities that require strict security tracking.
CREATE DOMAIN system_audit_logs_entity_type AS VARCHAR
    CHECK (VALUE IN ('USER', 'DEPARTMENT', 'DOCUMENT', 'DOCUMENT_VERSION', 'DOCUMENT_SHARE', 'COORDINATOR_REQUEST'));

-- Defines the high-value state mutations. (Notice we omit 'READ' to prevent bloat).
CREATE DOMAIN system_audit_logs_action AS VARCHAR
    CHECK (VALUE IN ('CREATED', 'UPDATED', 'DELETED', 'APPROVED', 'REJECTED', 'SUSPENDED', 'PUBLISHED'));

-- ------------------------------------------------------------------------------
-- 6.1: The Audit Trail
-- ------------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,

    entity_type system_audit_logs_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    action system_audit_logs_action NOT NULL,

    data JSONB NOT NULL,

    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL
);

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_target ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

CREATE INDEX idx_audit_logs_data ON audit_logs USING GIN (data);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Restricts ledger visibility strictly to Administrators and Coordinators for security compliance.
CREATE POLICY audit_logs_select_access ON audit_logs
    FOR SELECT USING (is_administrator_role() OR is_coordinator_role());

-- Allows authenticated users to write their own audit trails.
CREATE POLICY audit_logs_insert_access ON audit_logs
    FOR INSERT WITH CHECK (actor_id = get_current_id());
