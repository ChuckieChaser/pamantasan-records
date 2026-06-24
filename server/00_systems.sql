-- ==============================================================================
-- SECTION 0: SYSTEM CONTEXT & RLS HELPERS
-- ==============================================================================

-- 0.1: Context Retrieval Functions
CREATE OR REPLACE FUNCTION get_current_id() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.current_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_current_department_id() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.current_department_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

-- 0.2: Role Verification Functions
CREATE OR REPLACE FUNCTION is_administrator_role() RETURNS boolean AS $$
    SELECT current_setting('app.current_role', true) = 'ADMINISTRATOR';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION is_coordinator_role() RETURNS boolean AS $$
    SELECT current_setting('app.current_role', true) = 'COORDINATOR';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION is_director_role() RETURNS boolean AS $$
    SELECT current_setting('app.current_role', true) = 'DIRECTOR';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION is_officer_role() RETURNS boolean AS $$
    SELECT current_setting('app.current_role', true) = 'OFFICER';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION is_member_role() RETURNS boolean AS $$
    SELECT current_setting('app.current_role', true) = 'MEMBER';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION is_any_role() RETURNS boolean AS $$
    SELECT current_setting('app.current_role', true) IN ('ADMINISTRATOR', 'COORDINATOR', 'DIRECTOR', 'OFFICER', 'MEMBER');
$$ LANGUAGE SQL STABLE;
