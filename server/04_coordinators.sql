-- ==============================================================================
-- SECTION 4: COORDINATOR REQUESTS (MAKER-CHECKER SYSTEM)
-- ==============================================================================

-- --- System Domains (Maker-Checker Vocabulary) ---
CREATE DOMAIN system_coordinator_requests_action AS VARCHAR
    CHECK (VALUE IN ('USER_CREATE', 'USER_UPDATE', 'USER_SUSPEND', 'DOCUMENT_UPLOAD', 'DOCUMENT_UPDATE', 'DOCUMENT_DELETE', 'DEPARTMENT_CREATE', 'DEPARTMENT_UPDATE'));

CREATE DOMAIN system_coordinator_requests_status AS VARCHAR
    CHECK (VALUE IN ('PENDING', 'APPROVED', 'REJECTED'));

-- --- The Maker-Checker Queue ---
CREATE TABLE IF NOT EXISTS coordinator_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reviewer_id UUID REFERENCES users(id) ON DELETE RESTRICT,

    action system_coordinator_requests_action NOT NULL,
    data JSONB NOT NULL,

    status system_coordinator_requests_status NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT NULL,

    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_coordinator_requests_requester_id ON coordinator_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_coordinator_requests_status ON coordinator_requests(status);
CREATE INDEX IF NOT EXISTS idx_coordinator_requests_action ON coordinator_requests(action);
CREATE INDEX IF NOT EXISTS idx_coordinator_requests_data ON coordinator_requests USING GIN (data);

-- --- Triggers ---
DROP TRIGGER IF EXISTS set_timestamp_coordinator_requests ON coordinator_requests;
CREATE TRIGGER set_timestamp_coordinator_requests
    BEFORE UPDATE ON coordinator_requests
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- --- Row Level Security ---
ALTER TABLE coordinator_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY coordinator_requests_select_access ON coordinator_requests
    FOR SELECT USING (
        is_system_role()
        OR is_administrator_role()
        OR requester_id = get_user_current_id()
    );

CREATE POLICY coordinator_requests_insert_access ON coordinator_requests
    FOR INSERT WITH CHECK (
        is_system_role()
        OR (
            is_coordinator_role()
            AND requester_id = get_user_current_id()
        )
    );

CREATE POLICY coordinator_requests_update_access ON coordinator_requests
    FOR UPDATE USING (
        is_system_role()
        OR is_administrator_role()
    )
    WITH CHECK (
        is_system_role()
        OR is_administrator_role()
    );

CREATE POLICY coordinator_requests_delete_access ON coordinator_requests
    FOR DELETE USING (
        is_system_role()
        OR (
            requester_id = get_user_current_id()
            AND status = 'PENDING'
        )
    );
