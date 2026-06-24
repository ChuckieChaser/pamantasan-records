-- ==============================================================================
-- SECTION 5: NOTIFICATIONS (The Red Bell)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 5.0: System Domains (Notification Vocabulary)
-- ------------------------------------------------------------------------------
CREATE DOMAIN system_notifications_entity_type AS VARCHAR
    CHECK (VALUE IN ('DOCUMENT', 'COORDINATOR_REQUEST', 'DOCUMENT_REQUEST'));

CREATE DOMAIN system_notifications_action AS VARCHAR
    CHECK (VALUE IN ('CREATED', 'UPDATED', 'DELETED', 'APPROVED', 'REJECTED', 'UPLOADED', 'PUBLISHED', 'RESOLVED', 'COMMENTED'));

-- ------------------------------------------------------------------------------
-- 5.1: The Raw Notification Data (The Inbox)
-- ------------------------------------------------------------------------------
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,

    entity_type system_notifications_entity_type NOT NULL,
    entity_id UUID NOT NULL,
    action system_notifications_action NOT NULL,

    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_emailed BOOLEAN NOT NULL DEFAULT FALSE,

    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL
);

CREATE INDEX idx_notifications_inbox ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_target ON notifications(entity_type, entity_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Restricts notification visibility and state management entirely to the designated recipient.
CREATE POLICY notifications_all_access ON notifications
    FOR ALL USING (recipient_id = get_current_id());

-- ------------------------------------------------------------------------------
-- 5.2: The "Browser Console" Grouping View
-- ------------------------------------------------------------------------------
CREATE VIEW vw_notifications WITH (security_invoker = true) AS
SELECT
    recipient_id,
    entity_type,
    entity_id,
    action,

    -- Counts how many times this exact action happened
    COUNT(*) as interaction_count,

    -- Grabs the exact microsecond of the most recent event
    MAX(created_at) as last_interaction_at,

    -- Collects the unique IDs of everyone who did it
    ARRAY_AGG(DISTINCT actor_id) as actor_ids

FROM notifications
WHERE is_read = FALSE
GROUP BY
    recipient_id,
    entity_type,
    entity_id,
    action;
