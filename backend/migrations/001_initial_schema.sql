-- 001_initial_schema.sql: Enterprise Daily Habit Tracker Initial Schema

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',       -- 'USER' | 'ADMIN'
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',   -- 'ACTIVE' | 'SUSPENDED'
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL,
    is_system BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS habits (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    frequency_type VARCHAR(30) NOT NULL DEFAULT 'DAILY', -- 'DAILY', 'WEEKLY_DAYS', 'TIMES_PER_PERIOD'
    frequency_payload TEXT,                             -- JSON encoded: e.g. [1,3,5]
    target_type VARCHAR(20) NOT NULL DEFAULT 'BOOLEAN',  -- 'BOOLEAN', 'NUMERIC'
    target_value DECIMAL(10, 2),
    unit VARCHAR(30),
    reminder_time VARCHAR(5),                           -- 'HH:mm'
    color VARCHAR(20) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE INDEX IF NOT EXISTS idx_habits_user_archived ON habits(user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_habits_category ON habits(category_id);

CREATE TABLE IF NOT EXISTS habit_completions (
    id VARCHAR(36) PRIMARY KEY,
    habit_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    date VARCHAR(10) NOT NULL,                          -- 'YYYY-MM-DD'
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',    -- 'COMPLETED', 'SKIPPED'
    value DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    completed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_habit_date UNIQUE (habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_completions_habit_date ON habit_completions(habit_id, date);
CREATE INDEX IF NOT EXISTS idx_completions_user_date ON habit_completions(user_id, date);

CREATE TABLE IF NOT EXISTS streak_records (
    id VARCHAR(36) PRIMARY KEY,
    habit_id VARCHAR(36) NOT NULL UNIQUE,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    last_completed_date VARCHAR(10),                    -- 'YYYY-MM-DD'
    freeze_count_remaining INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_streaks_habit_id ON streak_records(habit_id);

CREATE TABLE IF NOT EXISTS habit_templates (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    frequency_type VARCHAR(30) NOT NULL DEFAULT 'DAILY',
    frequency_payload TEXT,
    target_type VARCHAR(20) NOT NULL DEFAULT 'BOOLEAN',
    target_value DECIMAL(10, 2),
    unit VARCHAR(30),
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(20) NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_templates_published ON habit_templates(is_published);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    actor_id VARCHAR(36) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT,                                       -- JSON metadata / before-after diff
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
