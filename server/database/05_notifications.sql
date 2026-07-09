SET client_min_messages = WARNING;

-- ==============================================================================
-- SECTION 5: NOTIFICATIONS (The Red Bell)
-- ==============================================================================

-- REFACTORED: Expanded to cover all major entities that require user alerts.
CREATE DOMAIN system_notifications_entity_type AS VARCHAR
    CHECK (VALUE IN ('USER', 'DEPARTMENT', 'DOCUMENT', 'COORDINATOR_REQUEST', 'DOCUMENT_REQUEST'));

-- REFACTORED: Expanded actions to strictly match the exact verbs defined in logic_flow.md.
CREATE DOMAIN system_notifications_action AS VARCHAR
    CHECK (VALUE IN (
        'CREATED', 'UPDATED', 'DELETED',
        'PENDING_APPROVAL', 'APPROVED', 'UNAPPROVED', 'REJECTED', 'STASHED',
        'UPLOADED', 'SHARED', 'UNSHARED', 'PUBLISHED', 'UNPUBLISHED',
        'ARCHIVED', 'UNARCHIVED', 'RESOLVED', 'COMMENTED', 'ATTACHED', 'SUSPENDED'
    ));

-- ==============================================================================
-- PHASE 1: SCHEMA CREATION
-- ==============================================================================
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

-- The Anti-Spam Aggregator View
CREATE OR REPLACE VIEW vw_notifications WITH (security_invoker = true) AS
SELECT
    recipient_id,
    entity_type,
    entity_id,
    action,
    COUNT(*) as interaction_count,
    MAX(created_at) as last_interaction_at,
    ARRAY_AGG(DISTINCT actor_id) as actor_ids,
    ARRAY_AGG(id) as notification_ids,
    BOOL_AND(is_read) as is_read
FROM notifications
GROUP BY
    recipient_id,
    entity_type,
    entity_id,
    action;

CREATE INDEX IF NOT EXISTS idx_notifications_inbox ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(entity_type, entity_id);

-- Attach the global timestamp trigger (Defined in 00_systems.sql)
DROP TRIGGER IF EXISTS set_timestamp_notifications ON notifications;
CREATE TRIGGER set_timestamp_notifications
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- ==============================================================================
-- PHASE 2: ROW LEVEL SECURITY POLICIES
-- ==============================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications FORCE ROW LEVEL SECURITY;

-- Visibility: Users can only see their own inbox.
CREATE POLICY notifications_select_access ON notifications
    FOR SELECT USING (is_system_role() OR recipient_id = get_user_current_id());

-- Insertion: STRICTLY locked to SYSTEM. Users cannot trigger their own notifications.
CREATE POLICY notifications_insert_access ON notifications
    FOR INSERT WITH CHECK (is_system_role());

-- Mutation (Marking as Read): Users can update their own notifications.
CREATE POLICY notifications_update_access ON notifications
    FOR UPDATE USING (is_system_role() OR recipient_id = get_user_current_id())
    WITH CHECK (is_system_role() OR recipient_id = get_user_current_id());

-- Deletion (Clearing Inbox): Users can delete their own notifications.
CREATE POLICY notifications_delete_access ON notifications
    FOR DELETE USING (is_system_role() OR recipient_id = get_user_current_id());
