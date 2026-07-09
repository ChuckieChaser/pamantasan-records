SET client_min_messages = WARNING;

-- ==============================================================================
-- SECTION 0: SYSTEM CONTEXT & RLS HELPERS
-- ==============================================================================

-- --- Context Retrieval Functions ---
CREATE OR REPLACE FUNCTION get_user_current_id() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.user_current_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_user_current_department_id() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.user_current_department_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

-- --- Role Verification Functions ---
CREATE OR REPLACE FUNCTION is_system_role() RETURNS boolean AS $$
    SELECT current_setting('app.user_current_role', true) = 'SYSTEM';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION is_administrator_role() RETURNS boolean AS $$
    SELECT current_setting('app.user_current_role', true) = 'ADMINISTRATOR';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION is_coordinator_role() RETURNS boolean AS $$
    SELECT current_setting('app.user_current_role', true) = 'COORDINATOR';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION is_director_role() RETURNS boolean AS $$
    SELECT current_setting('app.user_current_role', true) = 'DIRECTOR';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION is_officer_role() RETURNS boolean AS $$
    SELECT current_setting('app.user_current_role', true) = 'OFFICER';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION is_member_role() RETURNS boolean AS $$
    SELECT current_setting('app.user_current_role', true) = 'MEMBER';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION is_any_role() RETURNS boolean AS $$
    SELECT (
        is_system_role()
        OR is_administrator_role()
        OR is_coordinator_role()
        OR is_director_role()
        OR is_officer_role()
        OR is_member_role()
    );
$$ LANGUAGE SQL STABLE;

-- ==============================================================================
-- SECTION 0.1: GLOBAL TRIGGER FUNCTIONS
-- ==============================================================================

-- User Initialization (Creates credentials and settings upon user creation)
CREATE OR REPLACE FUNCTION trigger_initialize_user_data()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_credentials (user_id, password_hash)
    VALUES (NEW.id, NEW.university_id);

    INSERT INTO user_settings (user_id)
    VALUES (NEW.id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Folder Status Cascade (Recursively updates document_shares for the specific department)
CREATE OR REPLACE FUNCTION trigger_cascade_folder_status()
RETURNS TRIGGER AS $$
DECLARE
    v_is_folder BOOLEAN;
BEGIN
    -- Prevent infinite trigger loops during the recursive CTE update
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Check if the document associated with this share is a folder
        SELECT is_folder INTO v_is_folder FROM documents WHERE id = NEW.document_id;

        IF v_is_folder THEN
            WITH RECURSIVE descendants AS (
                SELECT id FROM documents WHERE parent_id = NEW.document_id
                UNION ALL
                SELECT d.id FROM documents d JOIN descendants ds ON d.parent_id = ds.id
            )
            -- Apply the new status only to the shares belonging to THIS specific department
            UPDATE document_shares
            SET status = NEW.status
            WHERE department_id = NEW.department_id
              AND document_id IN (SELECT id FROM descendants);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enforce strict role-based status transitions for document_shares
CREATE OR REPLACE FUNCTION trigger_enforce_share_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    -- If status isn't changing or action is done by SYSTEM or ADMIN, allow it
    IF OLD.status = NEW.status OR is_system_role() OR is_administrator_role() THEN
        RETURN NEW;
    END IF;

    -- For Officers:
    IF is_officer_role() THEN
        -- Officers can only toggle between PENDING_APPROVAL and APPROVED
        IF (OLD.status = 'PENDING_APPROVAL' AND NEW.status = 'APPROVED') OR
           (OLD.status = 'APPROVED' AND NEW.status = 'PENDING_APPROVAL') THEN
            RETURN NEW;
        ELSE
            RAISE EXCEPTION 'Officers can only transition shares between PENDING_APPROVAL and APPROVED. Attempted: % -> %', OLD.status, NEW.status;
        END IF;
    END IF;

    -- For Directors:
    IF is_director_role() THEN
        -- Directors can only toggle between APPROVED and PUBLISHED
        IF (OLD.status = 'APPROVED' AND NEW.status = 'PUBLISHED') OR
           (OLD.status = 'PUBLISHED' AND NEW.status = 'APPROVED') THEN
            RETURN NEW;
        ELSE
            RAISE EXCEPTION 'Directors can only transition shares between APPROVED and PUBLISHED. Attempted: % -> %', OLD.status, NEW.status;
        END IF;
    END IF;

    -- For any other role, block the transition
    RAISE EXCEPTION 'Unauthorized state transition by current role. Attempted: % -> %', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

-- Standard timestamp automation
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;