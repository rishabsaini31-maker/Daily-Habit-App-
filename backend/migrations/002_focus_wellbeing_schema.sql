-- 002_focus_wellbeing_schema.sql: Digital Well-Being & Opal-Grade OS Blocker Backend Schema

CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    streak_days INTEGER NOT NULL DEFAULT 0,
    total_gems INTEGER NOT NULL DEFAULT 50,
    tier_rank VARCHAR(20) NOT NULL DEFAULT 'Bronze',
    daily_baseline_minutes INTEGER NOT NULL DEFAULT 240,
    is_pro BOOLEAN NOT NULL DEFAULT 0,
    friend_partner_name VARCHAR(100),
    friend_partner_contact VARCHAR(100),
    nfc_tag_uid VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);

CREATE TABLE IF NOT EXISTS blocked_targets (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    platform VARCHAR(20) NOT NULL DEFAULT 'android',
    package_or_token VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    is_surgical_feed_only BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_target UNIQUE (user_id, platform, package_or_token)
);

CREATE INDEX IF NOT EXISTS idx_blocked_targets_user ON blocked_targets(user_id);

CREATE TABLE IF NOT EXISTS focus_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    strictness_mode VARCHAR(30) NOT NULL DEFAULT 'normal',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    time_saved_minutes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_status ON focus_sessions(user_id, status);

CREATE TABLE IF NOT EXISTS schedules (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(100) NOT NULL,
    trigger_type VARCHAR(30) NOT NULL DEFAULT 'time',
    days_of_week TEXT NOT NULL DEFAULT '[1,2,3,4,5,6,7]',
    start_time VARCHAR(8),
    end_time VARCHAR(8),
    geofence_lat REAL,
    geofence_lng REAL,
    geofence_radius_m INTEGER DEFAULT 200,
    step_goal INTEGER DEFAULT 5000,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_schedules_user_active ON schedules(user_id, is_active);

CREATE TABLE IF NOT EXISTS daily_metrics (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    metric_date VARCHAR(10) NOT NULL,
    focus_score INTEGER NOT NULL DEFAULT 100,
    total_screen_time_min INTEGER NOT NULL DEFAULT 0,
    blocked_time_min INTEGER NOT NULL DEFAULT 0,
    interceptions_count INTEGER NOT NULL DEFAULT 0,
    gems_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_daily_metric UNIQUE (user_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON daily_metrics(user_id, metric_date);

CREATE TABLE IF NOT EXISTS emergency_unlock_codes (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    session_id VARCHAR(36),
    otp_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES focus_sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_emergency_codes_user_session ON emergency_unlock_codes(user_id, session_id);

CREATE TABLE IF NOT EXISTS subscriptions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    original_transaction_id VARCHAR(255),
    product_id VARCHAR(100) NOT NULL,
    store VARCHAR(30) NOT NULL DEFAULT 'app_store',
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    is_active BOOLEAN NOT NULL DEFAULT 1,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_user_subscription UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
