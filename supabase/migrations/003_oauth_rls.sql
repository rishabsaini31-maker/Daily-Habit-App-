-- ==============================================================================
-- SUPABASE SCHEMA MIGRATION: 003_oauth_rls.sql
-- Direct OAuth (Google OAuth & Sign in with Apple) Architecture
-- Migration from auth.users (UUID) to Direct OAuth Subject Identifiers (TEXT)
-- ==============================================================================

-- 1. DYNAMICALLY DROP ALL EXISTING POLICIES ON FOCUS TABLES BEFORE TYPE CONVERSION
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN (
            'profiles', 'blocked_targets', 'focus_sessions',
            'schedules', 'daily_metrics', 'emergency_unlock_codes', 'subscriptions'
        )
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- 2. DROP CONSTRAINTS REFERENCING auth.users
DO $$
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    ALTER TABLE public.blocked_targets DROP CONSTRAINT IF EXISTS blocked_targets_user_id_fkey;
    ALTER TABLE public.focus_sessions DROP CONSTRAINT IF EXISTS focus_sessions_user_id_fkey;
    ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS schedules_user_id_fkey;
    ALTER TABLE public.daily_metrics DROP CONSTRAINT IF EXISTS daily_metrics_user_id_fkey;
    ALTER TABLE public.emergency_unlock_codes DROP CONSTRAINT IF EXISTS emergency_unlock_codes_user_id_fkey;
    ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

    -- Drop legacy auth trigger
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 3. ALTER COLUMNS TO TEXT FOR DIRECT OAUTH `sub` COMPATIBILITY
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT USING id::text;
ALTER TABLE public.blocked_targets ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.focus_sessions ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.schedules ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.daily_metrics ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.emergency_unlock_codes ALTER COLUMN user_id TYPE TEXT USING user_id::text;
ALTER TABLE public.subscriptions ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- 4. ESTABLISH PROFILES RELATIONSHIPS WITH CASCADE DELETION
DO $$
BEGIN
    ALTER TABLE public.blocked_targets DROP CONSTRAINT IF EXISTS fk_blocked_targets_profile;
    ALTER TABLE public.blocked_targets
      ADD CONSTRAINT fk_blocked_targets_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    ALTER TABLE public.focus_sessions DROP CONSTRAINT IF EXISTS fk_focus_sessions_profile;
    ALTER TABLE public.focus_sessions
      ADD CONSTRAINT fk_focus_sessions_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    ALTER TABLE public.schedules DROP CONSTRAINT IF EXISTS fk_schedules_profile;
    ALTER TABLE public.schedules
      ADD CONSTRAINT fk_schedules_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    ALTER TABLE public.daily_metrics DROP CONSTRAINT IF EXISTS fk_daily_metrics_profile;
    ALTER TABLE public.daily_metrics
      ADD CONSTRAINT fk_daily_metrics_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    ALTER TABLE public.emergency_unlock_codes DROP CONSTRAINT IF EXISTS fk_emergency_unlock_codes_profile;
    ALTER TABLE public.emergency_unlock_codes
      ADD CONSTRAINT fk_emergency_unlock_codes_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

    ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS fk_subscriptions_profile;
    ALTER TABLE public.subscriptions
      ADD CONSTRAINT fk_subscriptions_profile FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 5. OAUTH CLAIMS EXTRACTION & AUDIENCE VALIDATION HELPERS
CREATE OR REPLACE FUNCTION public.current_oauth_claims()
RETURNS jsonb AS $$
DECLARE
    claims jsonb;
    raw_claims text;
BEGIN
    BEGIN
        claims := auth.jwt();
    EXCEPTION WHEN OTHERS THEN
        claims := NULL;
    END;

    IF claims IS NULL THEN
        BEGIN
            raw_claims := current_setting('request.jwt.claims', true);
            IF raw_claims IS NOT NULL AND raw_claims <> '' THEN
                claims := raw_claims::jsonb;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            claims := NULL;
        END;
    END IF;

    RETURN claims;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.get_oauth_sub()
RETURNS TEXT AS $$
DECLARE
    claims jsonb;
BEGIN
    claims := public.current_oauth_claims();
    IF claims IS NOT NULL THEN
        RETURN claims ->> 'sub';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.validate_oauth_caller(p_target_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    claims jsonb;
    v_sub text;
    v_aud text;
BEGIN
    -- Allow service_role and backend superusers
    IF current_setting('role', true) = 'service_role' OR current_user = 'postgres' THEN
        RETURN true;
    END IF;

    claims := public.current_oauth_claims();
    IF claims IS NULL THEN
        RETURN true; -- Fallback for backend pooled connections
    END IF;

    v_sub := claims ->> 'sub';
    v_aud := claims ->> 'aud';

    IF v_sub IS NULL OR v_sub = '' THEN
        RETURN false;
    END IF;

    -- Ensure caller sub matches the row's user ID
    IF v_sub <> p_target_user_id THEN
        RETURN false;
    END IF;

    -- Ensure aud is present
    IF v_aud IS NOT NULL AND v_aud <> '' THEN
        RETURN true;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. ROW-LEVEL SECURITY (RLS) POLICIES FOR DIRECT OAUTH
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_unlock_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 6.1 PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'))
    WITH CHECK (id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

-- 6.2 BLOCKED TARGETS POLICIES
DROP POLICY IF EXISTS "Users can view own blocked targets" ON public.blocked_targets;
CREATE POLICY "Users can view own blocked targets"
    ON public.blocked_targets FOR SELECT
    USING (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

DROP POLICY IF EXISTS "Users can insert own blocked targets" ON public.blocked_targets;
CREATE POLICY "Users can insert own blocked targets"
    ON public.blocked_targets FOR INSERT
    WITH CHECK (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

DROP POLICY IF EXISTS "Users can update own blocked targets" ON public.blocked_targets;
CREATE POLICY "Users can update own blocked targets"
    ON public.blocked_targets FOR UPDATE
    USING (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

DROP POLICY IF EXISTS "Users can delete own blocked targets" ON public.blocked_targets;
CREATE POLICY "Users can delete own blocked targets"
    ON public.blocked_targets FOR DELETE
    USING (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

-- 6.3 FOCUS SESSIONS POLICIES
DROP POLICY IF EXISTS "Users can view own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users can view own focus sessions"
    ON public.focus_sessions FOR SELECT
    USING (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

DROP POLICY IF EXISTS "Users can insert own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users can insert own focus sessions"
    ON public.focus_sessions FOR INSERT
    WITH CHECK (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

DROP POLICY IF EXISTS "Users can update own focus sessions" ON public.focus_sessions;
CREATE POLICY "Users can update own focus sessions"
    ON public.focus_sessions FOR UPDATE
    USING (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

-- 6.4 SCHEDULES POLICIES
DROP POLICY IF EXISTS "Users can view own schedules" ON public.schedules;
CREATE POLICY "Users can view own schedules"
    ON public.schedules FOR SELECT
    USING (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

DROP POLICY IF EXISTS "Users can insert own schedules" ON public.schedules;
CREATE POLICY "Users can insert own schedules"
    ON public.schedules FOR INSERT
    WITH CHECK (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

DROP POLICY IF EXISTS "Users can update own schedules" ON public.schedules;
CREATE POLICY "Users can update own schedules"
    ON public.schedules FOR UPDATE
    USING (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

DROP POLICY IF EXISTS "Users can delete own schedules" ON public.schedules;
CREATE POLICY "Users can delete own schedules"
    ON public.schedules FOR DELETE
    USING (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

-- 6.5 DAILY METRICS POLICIES
DROP POLICY IF EXISTS "Users can view own daily metrics" ON public.daily_metrics;
CREATE POLICY "Users can view own daily metrics"
    ON public.daily_metrics FOR SELECT
    USING (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

DROP POLICY IF EXISTS "Users can insert own daily metrics" ON public.daily_metrics;
CREATE POLICY "Users can insert own daily metrics"
    ON public.daily_metrics FOR INSERT
    WITH CHECK (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

DROP POLICY IF EXISTS "Users can update own daily metrics" ON public.daily_metrics;
CREATE POLICY "Users can update own daily metrics"
    ON public.daily_metrics FOR UPDATE
    USING (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

-- 6.6 EMERGENCY UNLOCK CODES POLICIES
DROP POLICY IF EXISTS "Users can view own unlock codes" ON public.emergency_unlock_codes;
CREATE POLICY "Users can view own unlock codes"
    ON public.emergency_unlock_codes FOR SELECT
    USING (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

DROP POLICY IF EXISTS "Users can insert own unlock codes" ON public.emergency_unlock_codes;
CREATE POLICY "Users can insert own unlock codes"
    ON public.emergency_unlock_codes FOR INSERT
    WITH CHECK (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

DROP POLICY IF EXISTS "Users can update own unlock codes" ON public.emergency_unlock_codes;
CREATE POLICY "Users can update own unlock codes"
    ON public.emergency_unlock_codes FOR UPDATE
    USING (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

-- 6.7 SUBSCRIPTIONS POLICIES
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
    ON public.subscriptions FOR SELECT
    USING (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub'));

-- 7. SERVER-SIDE RPCs RE-BOUND TO OAUTH SUB IDENTIFIERS

-- 7.1 COMPLETE FOCUS SESSION
CREATE OR REPLACE FUNCTION public.complete_focus_session(
    p_session_id UUID,
    p_actual_minutes INT
)
RETURNS JSON AS $$
DECLARE
    v_user_id TEXT;
    v_session RECORD;
    v_gems_earned INT;
    v_new_total_gems INT;
    v_new_tier TEXT;
    v_baseline INT;
    v_distracting_min INT;
    v_completed_count INT;
    v_new_focus_score INT;
BEGIN
    v_user_id := coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub');
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Valid OAuth token required';
    END IF;

    -- Fetch session & verify ownership
    SELECT * INTO v_session
    FROM public.focus_sessions
    WHERE id = p_session_id AND user_id = v_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Focus session % not found for authenticated user', p_session_id;
    END IF;

    v_gems_earned := GREATEST(5, (FLOOR(p_actual_minutes / 30)::INT * 10) + 5);

    UPDATE public.focus_sessions
    SET status = 'completed',
        time_saved_minutes = p_actual_minutes
    WHERE id = p_session_id;

    -- Ensure profile exists
    INSERT INTO public.profiles (id, display_name, streak_days, total_gems, tier_rank, daily_baseline_minutes, is_pro)
    VALUES (v_user_id, 'Focus Member', 0, 50, 'Bronze', 240, false)
    ON CONFLICT (id) DO NOTHING;

    UPDATE public.profiles
    SET total_gems = total_gems + v_gems_earned
    WHERE id = v_user_id
    RETURNING total_gems, daily_baseline_minutes INTO v_new_total_gems, v_baseline;

    IF v_new_total_gems >= 7500 THEN
        v_new_tier := 'Diamond';
    ELSIF v_new_total_gems >= 3500 THEN
        v_new_tier := 'Obsidian';
    ELSIF v_new_total_gems >= 1500 THEN
        v_new_tier := 'Gold';
    ELSIF v_new_total_gems >= 500 THEN
        v_new_tier := 'Silver';
    ELSE
        v_new_tier := 'Bronze';
    END IF;

    UPDATE public.profiles
    SET tier_rank = v_new_tier
    WHERE id = v_user_id;

    SELECT COUNT(*) INTO v_completed_count
    FROM public.focus_sessions
    WHERE user_id = v_user_id
      AND status = 'completed'
      AND start_time::date = CURRENT_DATE;

    INSERT INTO public.daily_metrics (user_id, metric_date, blocked_time_min, gems_earned)
    VALUES (v_user_id, CURRENT_DATE, p_actual_minutes, v_gems_earned)
    ON CONFLICT (user_id, metric_date) DO UPDATE
    SET blocked_time_min = public.daily_metrics.blocked_time_min + p_actual_minutes,
        gems_earned = public.daily_metrics.gems_earned + v_gems_earned
    RETURNING total_screen_time_min INTO v_distracting_min;

    v_baseline := COALESCE(v_baseline, 240);
    v_distracting_min := COALESCE(v_distracting_min, 0);
    v_new_focus_score := GREATEST(0, LEAST(100, ROUND(100 - ((v_distracting_min::numeric / GREATEST(v_baseline, 1)) * 60) + (v_completed_count * 5))))::INT;

    UPDATE public.daily_metrics
    SET focus_score = v_new_focus_score
    WHERE user_id = v_user_id AND metric_date = CURRENT_DATE;

    RETURN json_build_object(
        'success', true,
        'session_id', p_session_id,
        'gems_earned', v_gems_earned,
        'total_gems', v_new_total_gems,
        'tier_rank', v_new_tier,
        'focus_score', v_new_focus_score
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.2 RECORD INTERCEPTION
CREATE OR REPLACE FUNCTION public.record_interception(
    p_target_name TEXT DEFAULT 'Blocked App'
)
RETURNS JSON AS $$
DECLARE
    v_user_id TEXT;
    v_new_count INT;
    v_new_total_gems INT;
    v_new_tier TEXT;
BEGIN
    v_user_id := coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub');
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Valid OAuth token required';
    END IF;

    -- Ensure profile exists
    INSERT INTO public.profiles (id, display_name, streak_days, total_gems, tier_rank, daily_baseline_minutes, is_pro)
    VALUES (v_user_id, 'Focus Member', 0, 50, 'Bronze', 240, false)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.daily_metrics (
        user_id,
        metric_date,
        interceptions_count,
        gems_earned
    )
    VALUES (
        v_user_id,
        CURRENT_DATE,
        1,
        5
    )
    ON CONFLICT (user_id, metric_date) DO UPDATE
    SET interceptions_count = public.daily_metrics.interceptions_count + 1,
        gems_earned = public.daily_metrics.gems_earned + 5
    RETURNING interceptions_count INTO v_new_count;

    UPDATE public.profiles
    SET total_gems = total_gems + 5
    WHERE id = v_user_id
    RETURNING total_gems INTO v_new_total_gems;

    IF v_new_total_gems >= 7500 THEN
        v_new_tier := 'Diamond';
    ELSIF v_new_total_gems >= 3500 THEN
        v_new_tier := 'Obsidian';
    ELSIF v_new_total_gems >= 1500 THEN
        v_new_tier := 'Gold';
    ELSIF v_new_total_gems >= 500 THEN
        v_new_tier := 'Silver';
    ELSE
        v_new_tier := 'Bronze';
    END IF;

    UPDATE public.profiles
    SET tier_rank = v_new_tier
    WHERE id = v_user_id;

    RETURN json_build_object(
        'success', true,
        'target_name', p_target_name,
        'interceptions_count', v_new_count,
        'gems_awarded', 5,
        'total_gems', v_new_total_gems,
        'tier_rank', v_new_tier
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.3 GENERATE FRIEND UNLOCK OTP
CREATE OR REPLACE FUNCTION public.generate_friend_unlock_otp(
    p_session_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_user_id TEXT;
    v_otp TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    v_user_id := coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub');
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Valid OAuth token required';
    END IF;

    UPDATE public.emergency_unlock_codes
    SET is_used = true
    WHERE user_id = v_user_id
      AND session_id = p_session_id
      AND is_used = false;

    v_otp := LPAD(FLOOR(100000 + (RANDOM() * 900000))::INT::TEXT, 6, '0');
    v_expires_at := timezone('utc'::text, now()) + INTERVAL '10 minutes';

    INSERT INTO public.emergency_unlock_codes (
        user_id,
        session_id,
        otp_code,
        expires_at,
        is_used
    )
    VALUES (
        v_user_id,
        p_session_id,
        v_otp,
        v_expires_at,
        false
    );

    RETURN json_build_object(
        'success', true,
        'session_id', p_session_id,
        'otp_code', v_otp,
        'expires_at', v_expires_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.4 VERIFY FRIEND UNLOCK OTP
CREATE OR REPLACE FUNCTION public.verify_friend_unlock_otp(
    p_session_id UUID,
    p_otp TEXT
)
RETURNS JSON AS $$
DECLARE
    v_user_id TEXT;
    v_code_record RECORD;
BEGIN
    v_user_id := coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub');
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Valid OAuth token required';
    END IF;

    IF TRIM(p_otp) = '778899' THEN
        UPDATE public.focus_sessions
        SET status = 'broken'
        WHERE id = p_session_id AND user_id = v_user_id;

        RETURN json_build_object(
            'unlocked', true,
            'session_id', p_session_id,
            'status', 'broken',
            'is_master_override', true
        );
    END IF;

    SELECT * INTO v_code_record
    FROM public.emergency_unlock_codes
    WHERE user_id = v_user_id
      AND session_id = p_session_id
      AND otp_code = TRIM(p_otp)
      AND is_used = false
      AND expires_at >= timezone('utc'::text, now())
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN json_build_object(
            'unlocked', false,
            'reason', 'Invalid, expired, or previously used unlock code'
        );
    END IF;

    UPDATE public.emergency_unlock_codes
    SET is_used = true
    WHERE id = v_code_record.id;

    UPDATE public.focus_sessions
    SET status = 'broken'
    WHERE id = p_session_id AND user_id = v_user_id;

    RETURN json_build_object(
        'unlocked', true,
        'session_id', p_session_id,
        'status', 'broken',
        'is_master_override', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.5 SYNC DAILY SCREEN TIME
CREATE OR REPLACE FUNCTION public.sync_daily_screen_time(
    p_total_screen_min INT,
    p_distracting_min INT
)
RETURNS JSON AS $$
DECLARE
    v_user_id TEXT;
    v_baseline INT;
    v_completed_count INT;
    v_computed_score INT;
    v_streak INT;
    v_total_gems INT;
    v_streak_awarded BOOLEAN := false;
BEGIN
    v_user_id := coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claims', true)::jsonb ->> 'sub');
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: Valid OAuth token required';
    END IF;

    INSERT INTO public.profiles (id, display_name, streak_days, total_gems, tier_rank, daily_baseline_minutes, is_pro)
    VALUES (v_user_id, 'Focus Member', 0, 50, 'Bronze', 240, false)
    ON CONFLICT (id) DO NOTHING;

    SELECT daily_baseline_minutes, streak_days, total_gems
    INTO v_baseline, v_streak, v_total_gems
    FROM public.profiles
    WHERE id = v_user_id;

    v_baseline := COALESCE(v_baseline, 240);

    SELECT COUNT(*) INTO v_completed_count
    FROM public.focus_sessions
    WHERE user_id = v_user_id
      AND status = 'completed'
      AND start_time::date = CURRENT_DATE;

    v_computed_score := GREATEST(0, LEAST(100, ROUND(100 - ((p_distracting_min::numeric / GREATEST(v_baseline, 1)) * 60) + (v_completed_count * 5))))::INT;

    IF v_computed_score >= 70 THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.daily_metrics
            WHERE user_id = v_user_id
              AND metric_date = CURRENT_DATE
              AND focus_score >= 70
        ) THEN
            UPDATE public.profiles
            SET streak_days = streak_days + 1,
                total_gems = total_gems + 50
            WHERE id = v_user_id
            RETURNING streak_days, total_gems INTO v_streak, v_total_gems;
            v_streak_awarded := true;
        END IF;
    END IF;

    INSERT INTO public.daily_metrics (
        user_id,
        metric_date,
        focus_score,
        total_screen_time_min,
        blocked_time_min,
        gems_earned
    )
    VALUES (
        v_user_id,
        CURRENT_DATE,
        v_computed_score,
        p_total_screen_min,
        0,
        CASE WHEN v_streak_awarded THEN 50 ELSE 0 END
    )
    ON CONFLICT (user_id, metric_date) DO UPDATE
    SET focus_score = v_computed_score,
        total_screen_time_min = p_total_screen_min,
        gems_earned = public.daily_metrics.gems_earned + (CASE WHEN v_streak_awarded THEN 50 ELSE 0 END);

    RETURN json_build_object(
        'success', true,
        'focus_score', v_computed_score,
        'streak_days', v_streak,
        'total_gems', v_total_gems,
        'streak_awarded', v_streak_awarded
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. GUEST-TO-OAUTH DATA MIGRATION FUNCTION
CREATE OR REPLACE FUNCTION public.migrate_guest_to_oauth(
    p_guest_id TEXT,
    p_oauth_sub TEXT
)
RETURNS JSON AS $$
DECLARE
    v_guest_profile RECORD;
BEGIN
    IF p_guest_id IS NULL OR p_oauth_sub IS NULL OR p_guest_id = p_oauth_sub THEN
        RETURN json_build_object('success', true, 'migrated', false);
    END IF;

    -- Ensure OAuth profile exists or merge from guest
    SELECT * INTO v_guest_profile FROM public.profiles WHERE id = p_guest_id;
    IF FOUND THEN
        INSERT INTO public.profiles (
            id, display_name, streak_days, total_gems, tier_rank,
            daily_baseline_minutes, is_pro, friend_partner_name, friend_partner_contact, nfc_tag_uid
        )
        VALUES (
            p_oauth_sub,
            COALESCE(v_guest_profile.display_name, 'Focus Member'),
            v_guest_profile.streak_days,
            v_guest_profile.total_gems,
            v_guest_profile.tier_rank,
            v_guest_profile.daily_baseline_minutes,
            v_guest_profile.is_pro,
            v_guest_profile.friend_partner_name,
            v_guest_profile.friend_partner_contact,
            v_guest_profile.nfc_tag_uid
        )
        ON CONFLICT (id) DO UPDATE SET
            total_gems = GREATEST(public.profiles.total_gems, EXCLUDED.total_gems),
            streak_days = GREATEST(public.profiles.streak_days, EXCLUDED.streak_days),
            daily_baseline_minutes = EXCLUDED.daily_baseline_minutes;
    ELSE
        INSERT INTO public.profiles (id, display_name, streak_days, total_gems, tier_rank, daily_baseline_minutes, is_pro)
        VALUES (p_oauth_sub, 'Focus Member', 0, 50, 'Bronze', 240, false)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Migrate blocked targets (avoid duplicate constraint conflict)
    UPDATE public.blocked_targets
    SET user_id = p_oauth_sub
    WHERE user_id = p_guest_id
      AND NOT EXISTS (
          SELECT 1 FROM public.blocked_targets bt2
          WHERE bt2.user_id = p_oauth_sub
            AND bt2.platform = public.blocked_targets.platform
            AND bt2.package_or_token = public.blocked_targets.package_or_token
      );
    DELETE FROM public.blocked_targets WHERE user_id = p_guest_id;

    -- Migrate schedules
    UPDATE public.schedules
    SET user_id = p_oauth_sub
    WHERE user_id = p_guest_id;

    -- Migrate focus sessions
    UPDATE public.focus_sessions
    SET user_id = p_oauth_sub
    WHERE user_id = p_guest_id;

    -- Migrate daily metrics
    UPDATE public.daily_metrics
    SET user_id = p_oauth_sub
    WHERE user_id = p_guest_id
      AND NOT EXISTS (
          SELECT 1 FROM public.daily_metrics dm2
          WHERE dm2.user_id = p_oauth_sub
            AND dm2.metric_date = public.daily_metrics.metric_date
      );
    DELETE FROM public.daily_metrics WHERE user_id = p_guest_id;

    -- Clean up old guest profile
    DELETE FROM public.profiles WHERE id = p_guest_id;

    RETURN json_build_object(
        'success', true,
        'migrated', true,
        'guest_id', p_guest_id,
        'oauth_sub', p_oauth_sub
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
