-- ==============================================================================
-- SECTION 2: USER MANAGEMENT
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 2.0: System Domains (User Vocabulary)
-- ------------------------------------------------------------------------------
CREATE DOMAIN system_users_role AS VARCHAR
    CHECK (VALUE IN ('ADMINISTRATOR', 'COORDINATOR', 'DIRECTOR', 'OFFICER', 'MEMBER'));

CREATE DOMAIN system_users_status AS VARCHAR
    CHECK (VALUE IN ('PENDING_PASSWORD', 'PENDING_SSO', 'VERIFIED'));

CREATE DOMAIN system_user_settings_theme AS VARCHAR
    CHECK (VALUE IN ('SYSTEM', 'LIGHT', 'DARK'));

CREATE DOMAIN system_user_settings_notification AS VARCHAR
    CHECK (VALUE IN ('ALL', 'SYSTEM', 'IMPORTANT'));

-- ------------------------------------------------------------------------------
-- 2.1: Core User Identity
-- ------------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    university_id VARCHAR(20) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,

    role system_users_role NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,

    status system_users_status NOT NULL DEFAULT 'PENDING_PASSWORD',
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,

    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,

    CONSTRAINT uq_users_university_id UNIQUE (university_id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT chk_users_university_id CHECK (university_id ~ '^[0-9]{2}-[0-9]{5}$'),
    CONSTRAINT chk_users_email CHECK (email ~ '^[A-Za-z0-9._%+-]+@university\.edu\.ph$')
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_university_id ON users(university_id);
CREATE INDEX idx_users_staffing ON users(department_id, role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_all_access ON users
    FOR ALL USING (is_administrator_role());

CREATE POLICY users_select_access ON users
    FOR SELECT USING (is_any_role());

-- ------------------------------------------------------------------------------
-- 2.2: User Credentials (Isolated Security)
-- ------------------------------------------------------------------------------
CREATE TABLE user_credentials (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    password_hash VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) NULL,

    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,

    CONSTRAINT uq_user_credentials_google_id UNIQUE (google_id)
);

CREATE INDEX idx_user_credentials_google_id ON user_credentials(google_id);

ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_credentials_all_access ON user_credentials
    FOR ALL USING (user_id = get_current_id());

CREATE POLICY user_credentials_insert_access ON user_credentials
    FOR INSERT WITH CHECK (is_administrator_role());

-- ------------------------------------------------------------------------------
-- 2.3: User Preferences
-- ------------------------------------------------------------------------------
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,

    theme system_user_settings_theme NOT NULL DEFAULT 'SYSTEM',
    notification system_user_settings_notification NOT NULL DEFAULT 'ALL',
    animation BOOLEAN NOT NULL DEFAULT TRUE,

    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_settings_all_access ON user_settings
    FOR ALL USING (user_id = get_current_id());

-- ------------------------------------------------------------------------------
-- 2.4: Active Sessions (Device Management)
-- ------------------------------------------------------------------------------
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,

    expires_at timestamptz NOT NULL,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL,

    CONSTRAINT uq_user_sessions_token_hash UNIQUE (token_hash)
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token_hash ON user_sessions(token_hash);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_sessions_all_access ON user_sessions
    FOR ALL USING (user_id = get_current_id() OR is_administrator_role());
