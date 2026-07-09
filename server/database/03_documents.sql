SET client_min_messages = WARNING;

-- ==============================================================================
-- SECTION 3: UNIFIED DOCUMENT MANAGEMENT & HELPDESK
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- --- System Domains ---
-- REFACTORED: Status now belongs to the share, tracking the pipeline per department.
CREATE DOMAIN system_document_share_status AS VARCHAR
    CHECK (VALUE IN ('PENDING_APPROVAL', 'APPROVED', 'PUBLISHED'));

CREATE DOMAIN system_document_requests_status AS VARCHAR
    CHECK (VALUE IN ('OPEN', 'RESOLVED', 'REJECTED'));

-- ==============================================================================
-- PHASE 1: SCHEMA CREATION
-- ==============================================================================

-- --- Tables ---
-- REFACTORED: The document is now a "dumb" container. It only tracks if it is globally archived.
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    comment TEXT NULL,
    is_folder BOOLEAN NOT NULL DEFAULT FALSE,
    summary TEXT NULL,
    embedding vector(1536) NULL,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approver_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    publisher_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    rejecter_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    version INT NOT NULL DEFAULT 1,
    checksum VARCHAR(64) NULL,
    path VARCHAR(512) NOT NULL,
    size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    change_summary TEXT NULL,
    rejection_reason TEXT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_document_versions_document_id_version UNIQUE (document_id, version),
    CONSTRAINT chk_document_versions_version CHECK (version > 0)
);

CREATE TABLE IF NOT EXISTS document_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    resolver_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    subject TEXT NOT NULL,
    status system_document_requests_status NOT NULL DEFAULT 'OPEN',
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_request_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_request_id UUID NOT NULL REFERENCES document_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    message TEXT NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- REFACTORED: The state machine lives here. Each department has total isolation.
CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    sharer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    recipient_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    status system_document_share_status NOT NULL DEFAULT 'PENDING_APPROVAL',
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_request_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_request_id UUID NOT NULL REFERENCES document_requests(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    attached_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_document_request_attachments UNIQUE (document_request_id, document_id)
);

-- --- Indexes ---
CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON documents(parent_id);
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_documents_is_archived ON documents(is_archived);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);

CREATE INDEX IF NOT EXISTS idx_document_requests_requester_id ON document_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_document_requests_status ON document_requests(status);

CREATE INDEX IF NOT EXISTS idx_document_request_messages_document_request_id ON document_request_messages(document_request_id);
CREATE INDEX IF NOT EXISTS idx_document_request_messages_thread ON document_request_messages(document_request_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_document_shares_sharer_id ON document_shares(sharer_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_recipient_routing ON document_shares(document_id, recipient_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_department_routing ON document_shares(document_id, department_id, status);

CREATE INDEX IF NOT EXISTS idx_document_request_attachments_routing ON document_request_attachments(document_request_id, document_id);

-- --- Triggers ---
-- REFACTORED: The cascade trigger is now attached to the SHARES table, not the documents table.
DROP TRIGGER IF EXISTS cascade_folder_status ON document_shares;
CREATE TRIGGER cascade_folder_status
    AFTER UPDATE OF status ON document_shares
    FOR EACH ROW
    EXECUTE FUNCTION trigger_cascade_folder_status();

DROP TRIGGER IF EXISTS enforce_share_status_transition ON document_shares;
CREATE TRIGGER enforce_share_status_transition
    BEFORE UPDATE OF status ON document_shares
    FOR EACH ROW
    EXECUTE FUNCTION trigger_enforce_share_status_transition();

-- Attach the global timestamp triggers
DROP TRIGGER IF EXISTS set_timestamp_documents ON documents;
CREATE TRIGGER set_timestamp_documents BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_document_versions ON document_versions;
CREATE TRIGGER set_timestamp_document_versions BEFORE UPDATE ON document_versions FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_document_requests ON document_requests;
CREATE TRIGGER set_timestamp_document_requests BEFORE UPDATE ON document_requests FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ==============================================================================
-- PHASE 2: ROW LEVEL SECURITY POLICIES
-- ==============================================================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents FORCE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE document_request_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_request_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares FORCE ROW LEVEL SECURITY;
ALTER TABLE document_request_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_request_attachments FORCE ROW LEVEL SECURITY;

-- Versions
CREATE POLICY document_versions_select_access ON document_versions FOR SELECT USING (is_system_role() OR is_administrator_role() OR is_coordinator_role() OR EXISTS (SELECT 1 FROM documents d WHERE d.id = document_versions.document_id));
CREATE POLICY document_versions_insert_access ON document_versions FOR INSERT WITH CHECK (is_system_role() OR is_administrator_role() OR is_coordinator_role());

-- Requests
CREATE POLICY document_requests_select_access ON document_requests FOR SELECT USING (is_system_role() OR is_administrator_role() OR is_coordinator_role() OR requester_id = get_user_current_id());
CREATE POLICY document_requests_insert_access ON document_requests FOR INSERT WITH CHECK (is_system_role() OR (requester_id = get_user_current_id() AND NOT is_administrator_role() AND NOT is_coordinator_role()));
CREATE POLICY document_requests_update_access ON document_requests FOR UPDATE USING (is_system_role() OR is_administrator_role() OR is_coordinator_role()) WITH CHECK (is_system_role() OR is_administrator_role() OR is_coordinator_role());
CREATE POLICY document_requests_delete_access ON document_requests FOR DELETE USING (is_system_role() OR (requester_id = get_user_current_id() AND status = 'OPEN'));

-- Messages
CREATE POLICY document_request_messages_select_access ON document_request_messages FOR SELECT USING (is_system_role() OR is_administrator_role() OR is_coordinator_role() OR EXISTS (SELECT 1 FROM document_requests dr WHERE dr.id = document_request_messages.document_request_id AND dr.requester_id = get_user_current_id()));
CREATE POLICY document_request_messages_insert_access ON document_request_messages FOR INSERT WITH CHECK (is_system_role() OR is_administrator_role() OR is_coordinator_role() OR (user_id = get_user_current_id() AND EXISTS (SELECT 1 FROM document_requests dr WHERE dr.id = document_request_messages.document_request_id AND dr.status = 'OPEN' AND (is_administrator_role() OR dr.requester_id = get_user_current_id()))));

-- Request Attachments
CREATE POLICY document_request_attachments_select_access ON document_request_attachments FOR SELECT USING (is_system_role() OR is_administrator_role() OR is_coordinator_role() OR EXISTS (SELECT 1 FROM document_requests dr WHERE dr.id = document_request_attachments.document_request_id AND dr.requester_id = get_user_current_id()));
CREATE POLICY document_request_attachments_insert_access ON document_request_attachments FOR INSERT WITH CHECK (is_system_role() OR is_administrator_role());
CREATE POLICY document_request_attachments_delete_access ON document_request_attachments FOR DELETE USING (is_system_role() OR is_administrator_role());

-- Shares
CREATE POLICY document_shares_select_access ON document_shares FOR SELECT USING (is_system_role() OR is_administrator_role() OR is_coordinator_role() OR ((is_director_role() OR is_officer_role()) AND department_id = get_user_current_department_id()) OR sharer_id = get_user_current_id() OR recipient_id = get_user_current_id() OR department_id = get_user_current_department_id());
CREATE POLICY document_shares_insert_access ON document_shares FOR INSERT WITH CHECK (is_system_role() OR is_administrator_role() OR (is_director_role() AND department_id = get_user_current_department_id()));
CREATE POLICY document_shares_update_access ON document_shares FOR UPDATE USING (is_system_role() OR is_administrator_role() OR ((is_director_role() OR is_officer_role()) AND department_id = get_user_current_department_id())) WITH CHECK (is_system_role() OR is_administrator_role() OR ((is_director_role() OR is_officer_role()) AND department_id = get_user_current_department_id()));
CREATE POLICY document_shares_delete_access ON document_shares FOR DELETE USING (is_system_role() OR is_administrator_role() OR (is_director_role() AND department_id = get_user_current_department_id()));

-- Documents (The Mega-Filter)
-- REFACTORED: Now checking the status inside the document_shares table (ds.status)
CREATE POLICY documents_select_access ON documents FOR SELECT USING (
    is_system_role() OR
    is_administrator_role() OR
    is_coordinator_role() OR
    (
        is_archived = FALSE AND (
            uploader_id = get_user_current_id() OR

            -- Department Pipeline Routing
            EXISTS (
                SELECT 1 FROM document_shares ds
                WHERE ds.document_id = documents.id
                AND ds.department_id = get_user_current_department_id()
                AND (
                    (ds.status IN ('PENDING_APPROVAL', 'APPROVED', 'PUBLISHED') AND is_officer_role()) OR
                    (ds.status IN ('APPROVED', 'PUBLISHED') AND is_director_role()) OR
                    (ds.status = 'PUBLISHED' AND is_member_role() AND (ds.recipient_id IS NULL OR ds.recipient_id = get_user_current_id()))
                )
            ) OR

            -- Helpdesk Ticket Routing
            EXISTS (
                SELECT 1 FROM document_request_attachments dra
                JOIN document_requests dr ON dra.document_request_id = dr.id
                WHERE dra.document_id = documents.id AND dr.requester_id = get_user_current_id()
            )
        )
    )
);

CREATE POLICY documents_insert_access ON documents FOR INSERT WITH CHECK (is_system_role() OR is_administrator_role() OR is_coordinator_role());

-- REFACTORED: Now checking the status inside the document_shares table (ds.status)
CREATE POLICY documents_update_access ON documents FOR UPDATE USING (
    is_system_role() OR
    is_administrator_role() OR
    (
        EXISTS (SELECT 1 FROM document_shares ds WHERE ds.document_id = documents.id AND ds.department_id = get_user_current_department_id() AND
            (
                (ds.status IN ('PENDING_APPROVAL', 'APPROVED') AND is_officer_role()) OR
                (ds.status IN ('APPROVED', 'PUBLISHED') AND is_director_role())
            )
        )
    )
) WITH CHECK (
    is_system_role() OR
    is_administrator_role() OR
    (
        EXISTS (SELECT 1 FROM document_shares ds WHERE ds.document_id = documents.id AND ds.department_id = get_user_current_department_id() AND
            (
                (ds.status IN ('PENDING_APPROVAL', 'APPROVED') AND is_officer_role()) OR
                (ds.status IN ('APPROVED', 'PUBLISHED') AND is_director_role())
            )
        )
    )
);

CREATE POLICY documents_delete_access ON documents FOR DELETE USING (is_system_role() OR is_administrator_role());
