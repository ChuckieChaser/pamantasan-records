-- ==============================================================================
-- SECTION 3: UNIFIED DOCUMENT MANAGEMENT & HELPDESK
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ------------------------------------------------------------------------------
-- 3.0: System Domains (Document & Ticket Vocabulary)
-- ------------------------------------------------------------------------------
CREATE DOMAIN system_documents_status AS VARCHAR
    CHECK (VALUE IN ('UPLOADED', 'PENDING_OFFICER', 'PENDING_DIRECTOR', 'PUBLISHED', 'ATTACHMENT'));

CREATE DOMAIN system_document_requests_status AS VARCHAR
    CHECK (VALUE IN ('OPEN', 'RESOLVED', 'REJECTED'));

-- ------------------------------------------------------------------------------
-- 3.1: Primary Document Store (The Single Source of Truth)
-- ------------------------------------------------------------------------------
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,

    name VARCHAR(255) NOT NULL,
    comment TEXT NULL,
    is_folder BOOLEAN NOT NULL DEFAULT FALSE,
    summary TEXT NULL,
    embedding vector(1536) NULL,

    status system_documents_status NOT NULL DEFAULT 'UPLOADED',

    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
    deleted_at timestamptz DEFAULT NULL
);

CREATE INDEX idx_documents_parent_id ON documents(parent_id);
CREATE INDEX idx_documents_embedding ON documents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_deleted_at ON documents(deleted_at);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_all_access ON documents
    FOR ALL USING (is_administrator_role());

CREATE POLICY documents_select_access ON documents
    FOR SELECT
    USING (
        deleted_at IS NULL
        AND (
            uploader_id = get_current_id()
            OR EXISTS (
                SELECT 1 FROM document_versions dv
                WHERE dv.document_id = documents.id
                AND dv.rejecter_id = get_current_id()
            )
            OR EXISTS (
                SELECT 1 FROM document_shares ds
                WHERE ds.document_id = documents.id
                AND (
                    (ds.department_id = get_current_department_id()
                        AND (
                            (status IN ('PENDING_OFFICER', 'PENDING_DIRECTOR', 'PUBLISHED') AND is_officer_role())
                            OR (status IN ('PENDING_DIRECTOR', 'PUBLISHED') AND is_director_role())
                            OR (status = 'PUBLISHED' AND is_member_role() AND (ds.recipient_id IS NULL OR ds.recipient_id = get_current_id()))
                        )
                    )
                    OR (
                        status = 'ATTACHMENT'
                        AND ds.document_request_id IS NOT NULL
                        AND EXISTS (
                            SELECT 1 FROM document_requests dr
                            WHERE dr.id = ds.document_request_id
                            AND dr.requester_id = get_current_id()
                        )
                    )
                )
            )
        )
    );

CREATE POLICY documents_update_access ON documents
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM document_shares ds
            WHERE ds.document_id = documents.id
            AND ds.department_id = get_current_department_id()
        )
        AND (
            (status = 'PENDING_OFFICER' AND is_officer_role())
            OR (status = 'PENDING_DIRECTOR' AND is_director_role())
        )
    );

-- ------------------------------------------------------------------------------
-- 3.2: Document Versions (Physical Files)
-- ------------------------------------------------------------------------------
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    rejecter_id UUID REFERENCES users(id) ON DELETE SET NULL,

    version INT NOT NULL DEFAULT 1,
    checksum VARCHAR(64) NULL,
    path VARCHAR(512) NOT NULL,
    size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    change_summary TEXT NULL,
    rejection_reason TEXT NULL,

    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
    rejected_at timestamptz DEFAULT NULL,

    CONSTRAINT uq_document_versions_document_id_version UNIQUE (document_id, version),
    CONSTRAINT chk_document_versions_version CHECK (version > 0)
);

CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_versions_timeline ON document_versions(document_id, version DESC);

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY document_versions_all_access ON document_versions
    FOR ALL USING (is_administrator_role());

CREATE POLICY document_versions_select_access ON document_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM documents d
            WHERE d.id = document_versions.document_id
        )
    );

-- ------------------------------------------------------------------------------
-- 3.3: Document Requests (The Helpdesk Tickets)
-- ------------------------------------------------------------------------------
CREATE TABLE document_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resolver_id UUID REFERENCES users(id) ON DELETE SET NULL,

    subject TEXT NOT NULL,
    status system_document_requests_status NOT NULL DEFAULT 'OPEN',

    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL
);

CREATE INDEX idx_document_requests_requester_id ON document_requests(requester_id);
CREATE INDEX idx_document_requests_status ON document_requests(status);

ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY document_requests_select_access ON document_requests
    FOR SELECT USING (is_administrator_role() OR requester_id = get_current_id());

CREATE POLICY document_requests_insert_access ON document_requests
    FOR INSERT WITH CHECK (
        requester_id = get_current_id()
        AND NOT is_administrator_role()
        AND NOT is_coordinator_role()
    );

CREATE POLICY document_requests_update_access ON document_requests
    FOR UPDATE USING (is_administrator_role());

CREATE POLICY document_requests_delete_access ON document_requests
    FOR DELETE USING (
        requester_id = get_current_id()
        AND status = 'OPEN'
    );

-- ------------------------------------------------------------------------------
-- 3.4: Document Request Messages (The Chat Room)
-- ------------------------------------------------------------------------------
CREATE TABLE document_request_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_request_id UUID NOT NULL REFERENCES document_requests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    message TEXT NOT NULL,

    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL
);

CREATE INDEX idx_document_request_messages_document_request_id ON document_request_messages(document_request_id);
CREATE INDEX idx_document_request_messages_thread ON document_request_messages(document_request_id, created_at ASC);

ALTER TABLE document_request_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY document_request_messages_select_access ON document_request_messages
    FOR SELECT
    USING (
        is_administrator_role()
        OR EXISTS (
            SELECT 1 FROM document_requests dr
            WHERE dr.id = document_request_messages.document_request_id
            AND dr.requester_id = get_current_id()
        )
    );

CREATE POLICY document_request_messages_insert_access ON document_request_messages
    FOR INSERT
    WITH CHECK (
        user_id = get_current_id()
        AND EXISTS (
            SELECT 1 FROM document_requests dr
            WHERE dr.id = document_request_messages.document_request_id
            AND dr.status = 'OPEN'
            AND (is_administrator_role() OR dr.requester_id = get_current_id())
        )
    );

-- ------------------------------------------------------------------------------
-- 3.5: Document Access Control (The Unified Router)
-- ------------------------------------------------------------------------------
CREATE TABLE document_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    sharer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,

    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    document_request_id UUID REFERENCES document_requests(id) ON DELETE CASCADE,

    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,

    CONSTRAINT chk_document_shares_routing CHECK (
        (department_id IS NOT NULL AND document_request_id IS NULL) OR
        (department_id IS NULL AND document_request_id IS NOT NULL)
    )
);

CREATE INDEX idx_document_shares_recipient_routing ON document_shares(document_id, recipient_id);
CREATE INDEX idx_document_shares_department_routing ON document_shares(document_id, department_id);
CREATE INDEX idx_document_shares_ticket_routing ON document_shares(document_id, document_request_id);

ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY document_shares_all_access ON document_shares
    FOR ALL
    USING (
        is_administrator_role()
        OR ((is_director_role() OR is_officer_role()) AND department_id = get_current_department_id())
    );

CREATE POLICY document_shares_select_access ON document_shares
    FOR SELECT
    USING (
        sharer_id = get_current_id()
        OR recipient_id = get_current_id()
        OR department_id = get_current_department_id()
        OR EXISTS (
            SELECT 1 FROM document_requests dr
            WHERE dr.id = document_shares.document_request_id
            AND dr.requester_id = get_current_id()
        )
    );
