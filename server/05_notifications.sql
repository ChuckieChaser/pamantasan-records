-- ==============================================================================
-- SECTION 5: NOTIFICATIONS (The Red Bell)
-- ==============================================================================

-- --- System Domains (Notification Vocabulary) ---
CREATE DOMAIN system_notifications_entity_type AS VARCHAR
    CHECK (VALUE IN ('DOCUMENT', 'COORDINATOR_REQUEST', 'DOCUMENT_REQUEST'));

CREATE DOMAIN system_notifications_action AS VARCHAR
    CHECK (VALUE IN ('CREATED', 'UPDATED', 'DELETED', 'APPROVED', 'REJECTED', 'UPLOADED', 'PUBLISHED', 'RESOLVED', 'COMMENTED'));

-- --- The Raw Notification Data (The Inbox) ---
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID NULL REFERENCES users(id) ON DELETE RESTRICT,

    entity_type system_notifications_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    action system_notifications_action NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_emailed BOOLEAN NOT NULL DEFAULT FALSE,

    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_inbox ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(entity_type, entity_id);

-- --- Triggers ---
DROP TRIGGER IF EXISTS set_timestamp_notifications ON notifications;
CREATE TRIGGER set_timestamp_notifications
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- --- Row Level Security ---
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_access ON notifications
    FOR SELECT USING (
        is_system_role()
        OR recipient_id = get_user_current_id()
    );

CREATE POLICY notifications_insert_access ON notifications
    FOR INSERT WITH CHECK (
        is_system_role()
    );

CREATE POLICY notifications_update_access ON notifications
    FOR UPDATE USING (
        is_system_role()
        OR recipient_id = get_user_current_id()
    )
    WITH CHECK (
        is_system_role()
        OR recipient_id = get_user_current_id()
    );

CREATE POLICY notifications_delete_access ON notifications
    FOR DELETE USING (
        is_system_role()
        OR recipient_id = get_user_current_id()
    );

-- --- The "Browser Console" Grouping View ---
CREATE OR REPLACE VIEW vw_notifications WITH (security_invoker = true) AS
SELECT
    recipient_id,
    entity_type,
    entity_id,
    action,

    COUNT(*) as interaction_count,
    MAX(created_at) as last_interaction_at,
    ARRAY_AGG(DISTINCT actor_id) as actor_ids

FROM notifications
WHERE is_read = FALSE
GROUP BY
    recipient_id,
    entity_type,
    entity_id,
    action;
