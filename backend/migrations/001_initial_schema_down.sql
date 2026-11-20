-- 001_initial_schema_down.sql: Reversible rollback for Initial Schema

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS habit_templates;
DROP TABLE IF EXISTS streak_records;
DROP TABLE IF EXISTS habit_completions;
DROP TABLE IF EXISTS habits;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
