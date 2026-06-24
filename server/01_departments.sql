-- ==============================================================================
-- SECTION 1: ORGANIZATION STRUCTURE
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1.1: Departments Registry
-- ------------------------------------------------------------------------------
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,

    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,

    CONSTRAINT uq_departments_name UNIQUE (name),
    CONSTRAINT uq_departments_code UNIQUE (code)
);

CREATE INDEX idx_departments_code ON departments(code);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Restricts structural modifications (Insert/Update/Delete) to administrators
CREATE POLICY departments_all_access ON departments
    FOR ALL USING (is_administrator_role());

-- Grants global read access for UI population and relational mapping
CREATE POLICY departments_select_access ON departments
    FOR SELECT USING (is_any_role());
