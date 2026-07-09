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

-- --- Global Triggers ---
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;