-- ==============================================================================
-- SECTION 4: COORDINATOR REQUESTS (MAKER-CHECKER SYSTEM)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 4.0: System Domains (Maker-Checker Vocabulary)
-- ------------------------------------------------------------------------------
CREATE DOMAIN system_coordinator_requests_action AS VARCHAR
    CHECK (VALUE IN ('USER_CREATE', 'USER_UPDATE', 'USER_SUSPEND', 'DOCUMENT_UPLOAD', 'DOCUMENT_UPDATE', 'DOCUMENT_DELETE', 'DEPARTMENT_CREATE', 'DEPARTMENT_UPDATE'));

CREATE DOMAIN system_coordinator_requests_status AS VARCHAR
    CHECK (VALUE IN ('PENDING', 'APPROVED', 'REJECTED'));

-- ------------------------------------------------------------------------------
-- 4.1: The Maker-Checker Queue
-- ------------------------------------------------------------------------------
CREATE TABLE coordinator_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reviewer_id UUID REFERENCES users(id) ON DELETE RESTRICT,

    action system_coordinator_requests_action NOT NULL,
    data JSONB NOT NULL,

    status system_coordinator_requests_status NOT NULL DEFAULT 'PENDING',
    rejection_reason TEXT NULL,

    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
    resolved_at timestamptz NULL
);

CREATE INDEX idx_coordinator_requests_requester_id ON coordinator_requests(requester_id);
CREATE INDEX idx_coordinator_requests_status ON coordinator_requests(status);
CREATE INDEX idx_coordinator_requests_action ON coordinator_requests(action);
CREATE INDEX idx_coordinator_requests_data ON coordinator_requests USING GIN (data);

ALTER TABLE coordinator_requests ENABLE ROW LEVEL SECURITY;

-- Grants Admins complete governance over the approval queue.
CREATE POLICY coordinator_requests_all_access ON coordinator_requests
    FOR ALL USING (is_administrator_role());

-- Limits visibility to enforce privacy: Coordinators can only audit their own submitted requests.
CREATE POLICY coordinator_requests_select_access ON coordinator_requests
    FOR SELECT USING (requester_id = get_current_id());

-- Enforces the Maker role: Restricts queue insertion strictly to Coordinators and physically prevents identity spoofing.
CREATE POLICY coordinator_requests_insert_access ON coordinator_requests
    FOR INSERT WITH CHECK (is_coordinator_role() AND requester_id = get_current_id());
