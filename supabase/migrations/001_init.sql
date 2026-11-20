-- ==============================================================================
-- SUPABASE SCHEMA MIGRATION: 001_init.sql
-- Digital Well-Being & Opal-Grade OS Blocker Architecture
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    streak_days INT NOT NULL DEFAULT 0,
    total_gems INT NOT NULL DEFAULT 0,
    tier_rank TEXT NOT NULL DEFAULT 'Bronze',
    daily_baseline_minutes INT NOT NULL DEFAULT 240,
    is_pro BOOLEAN NOT NULL DEFAULT false,
    friend_partner_name TEXT,
    friend_partner_contact TEXT,
    nfc_tag_uid TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. BLOCKED TARGETS TABLE
CREATE TABLE IF NOT EXISTS public.blocked_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
    package_or_token TEXT NOT NULL,
    display_name TEXT NOT NULL,
    is_surgical_feed_only BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_target UNIQUE (user_id, platform, package_or_token)
);

-- 3. FOCUS SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.focus_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL,
    strictness_mode TEXT NOT NULL CHECK (strictness_mode IN ('normal', 'deep_focus', 'friend_or_nfc')),
    status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'broken')),
    time_saved_minutes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('time', 'geofence', 'health_steps')),
    days_of_week INT[] NOT NULL DEFAULT '{1,2,3,4,5,6,7}',
    start_time TIME,
    end_time TIME,
    geofence_lat FLOAT8,
    geofence_lng FLOAT8,
    geofence_radius_m INT DEFAULT 200,
    step_goal INT DEFAULT 5000,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. DAILY METRICS TABLE
CREATE TABLE IF NOT EXISTS public.daily_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    focus_score INT NOT NULL DEFAULT 100 CHECK (focus_score >= 0 AND focus_score <= 100),
    total_screen_time_min INT NOT NULL DEFAULT 0,
    blocked_time_min INT NOT NULL DEFAULT 0,
    interceptions_count INT NOT NULL DEFAULT 0,
    gems_earned INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_user_daily_metric UNIQUE (user_id, metric_date)
);

-- 6. EMERGENCY UNLOCK CODES TABLE (Friend Lock OTPs)
CREATE TABLE IF NOT EXISTS public.emergency_unlock_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.focus_sessions(id) ON DELETE CASCADE,
    otp_code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: auth.uid() = user_id on all tables
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_unlock_codes ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Blocked Targets Policies
DROP POLICY IF EXISTS "Users can view own blocked targets" ON public.blocked_targets;
CREATE POLICY "Users can view own blocked targets"
    ON public.blocked_targets FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own blocked targets" ON public.blocked_targets;
CREATE POLICY "Users can insert own blocked targets"
    ON public.blocked_targets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own blocked targets" ON public.blocked_targets;
CREATE POLICY "Users can update own blocked targets"
    ON public.blocked_targets FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own blocked targets" ON public.blocked_targets;
CREATE POLICY "Users can delete own blocked targets"
    ON public.blocked_targets FOR DELETE
    USING (auth.uid() = user_id);

-- Focus Sessions Policies
DROP POLICY IF EXISTS "Users can view own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users can view own focus sessions"
    ON public.focus_sessions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users can insert own focus sessions"
    ON public.focus_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users can update own focus sessions"
    ON public.focus_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Schedules Policies
DROP POLICY IF EXISTS "Users can view own schedules" ON public.schedules;
CREATE POLICY "Users can view own schedules"
    ON public.schedules FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own schedules" ON public.schedules;
CREATE POLICY "Users can insert own schedules"
    ON public.schedules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own schedules" ON public.schedules;
CREATE POLICY "Users can update own schedules"
    ON public.schedules FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own schedules" ON public.schedules;
CREATE POLICY "Users can delete own schedules"
    ON public.schedules FOR DELETE
    USING (auth.uid() = user_id);

-- Daily Metrics Policies
DROP POLICY IF EXISTS "Users can view own daily metrics" ON public.daily_metrics;
CREATE POLICY "Users can view own daily metrics"
    ON public.daily_metrics FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own daily metrics" ON public.daily_metrics;
CREATE POLICY "Users can insert own daily metrics"
    ON public.daily_metrics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own daily metrics" ON public.daily_metrics;
CREATE POLICY "Users can update own daily metrics"
    ON public.daily_metrics FOR UPDATE
    USING (auth.uid() = user_id);

-- Emergency Unlock Codes Policies
DROP POLICY IF EXISTS "Users can view own emergency codes" ON public.emergency_unlock_codes;
CREATE POLICY "Users can view own emergency codes"
    ON public.emergency_unlock_codes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own emergency codes" ON public.emergency_unlock_codes;
CREATE POLICY "Users can insert own emergency codes"
    ON public.emergency_unlock_codes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own emergency codes" ON public.emergency_unlock_codes;
CREATE POLICY "Users can update own emergency codes"
    ON public.emergency_unlock_codes FOR UPDATE
    USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER FOR AUTH (including anonymous users)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, daily_baseline_minutes)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Focus Pioneer'),
        240
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.daily_metrics (user_id, metric_date, focus_score)
    VALUES (NEW.id, CURRENT_DATE, 100)
    ON CONFLICT (user_id, metric_date) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_blocked_targets_user ON public.blocked_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_status ON public.focus_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_schedules_user_active ON public.schedules(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON public.daily_metrics(user_id, metric_date);
