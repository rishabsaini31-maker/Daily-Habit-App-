-- ==============================================================================
-- MIGRATION 004: ADMIN CONTROL PANEL, REMOTE CONFIG & WEBHOOK LOGS
-- ==============================================================================

-- 1. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
    id TEXT PRIMARY KEY, -- OAuth sub or email identifier
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'support' CHECK (role IN ('super_admin', 'support')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 2. APP REMOTE CONFIG (OTA SURGICAL SELECTORS, PAYWALL CONFIG, FEATURE FLAGS)
CREATE TABLE IF NOT EXISTS public.app_remote_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_remote_config ENABLE ROW LEVEL SECURITY;

-- 3. WEBHOOK LOGS (REVENUECAT & SYSTEM EVENTS)
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    event_type TEXT NOT NULL,
    user_id TEXT,
    status TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- 4. SEED INITIAL REMOTE CONFIGURATION
INSERT INTO public.app_remote_config (key, value, description)
VALUES 
    (
        'surgical_selectors',
        '{
            "instagram": [
                "clips_viewer_view_pager",
                "reels_tray_container",
                "reel_viewer_container",
                "clips_video_container"
            ],
            "youtube": [
                "reel_recycler",
                "shorts_shelf",
                "reel_player_page",
                "shorts_container"
            ]
        }'::jsonb,
        'OTA Android Accessibility Node IDs for surgical short-form video blocking'
    ),
    (
        'paywall_config',
        '{
            "yearly_price": "$49.99",
            "monthly_price": "$8.99",
            "trial_days": 7,
            "headline": "Unlock Total Digital Freedom",
            "features": [
                "Deep Focus Mode (Unbreakable Guard)",
                "Surgical Reels & Shorts Blocker",
                "Unlimited Geofence & Sleep Schedules",
                "Friend Lock Emergency OTP Shield",
                "NFC Hardware Tag Integration"
            ]
        }'::jsonb,
        'Live pricing, trial terms, and feature list shown on mobile Pro paywall'
    ),
    (
        'feature_flags',
        '{
            "nfc_lock_enabled": true,
            "step_unlock_enabled": true,
            "friend_lock_enabled": true,
            "anti_uninstall_enabled": true
        }'::jsonb,
        'Global kill-switches and feature availability toggles'
    )
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = now();

-- Seed Initial Super Admin User
INSERT INTO public.admin_users (id, email, role)
VALUES 
    ('admin_root', 'admin@focusapp.com', 'super_admin'),
    ('admin_demo', 'demo.admin@focusapp.com', 'super_admin')
ON CONFLICT (id) DO NOTHING;

-- 5. ADMIN AUTHENTICATION HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_sub TEXT;
    v_email TEXT;
    v_is_admin BOOLEAN := FALSE;
BEGIN
    -- Superuser / service role bypass
    IF current_user IN ('postgres', 'service_role') THEN
        RETURN TRUE;
    END IF;

    -- Extract sub and email claims
    BEGIN
        v_sub := coalesce(
            auth.jwt() ->> 'sub',
            current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
        );
        v_email := coalesce(
            auth.jwt() ->> 'email',
            current_setting('request.jwt.claims', true)::jsonb ->> 'email'
        );
    EXCEPTION WHEN OTHERS THEN
        v_sub := NULL;
        v_email := NULL;
    END;

    IF v_sub IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.admin_users WHERE id = v_sub OR email = v_sub
        ) INTO v_is_admin;
        IF v_is_admin THEN RETURN TRUE; END IF;
    END IF;

    IF v_email IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.admin_users WHERE email = v_email OR id = v_email
        ) INTO v_is_admin;
        IF v_is_admin THEN RETURN TRUE; END IF;
    END IF;

    RETURN FALSE;
END;
$$;

-- 6. ROW LEVEL SECURITY POLICIES

-- Admin Users RLS: Only admins can view or modify admin table
DROP POLICY IF EXISTS "Admin users viewable by admins" ON public.admin_users;
CREATE POLICY "Admin users viewable by admins"
    ON public.admin_users FOR SELECT
    USING (public.is_admin_user());

-- Remote Config RLS:
-- EVERYONE (mobile client and anon) can read remote config
DROP POLICY IF EXISTS "Remote config readable by all" ON public.app_remote_config;
CREATE POLICY "Remote config readable by all"
    ON public.app_remote_config FOR SELECT
    USING (true);

-- ONLY admins can write remote config
DROP POLICY IF EXISTS "Remote config writable by admins" ON public.app_remote_config;
CREATE POLICY "Remote config writable by admins"
    ON public.app_remote_config FOR ALL
    USING (public.is_admin_user());

-- Webhook Logs RLS: Only admins and service role can read/write logs
DROP POLICY IF EXISTS "Webhook logs accessible by admins" ON public.webhook_logs;
CREATE POLICY "Webhook logs accessible by admins"
    ON public.webhook_logs FOR ALL
    USING (public.is_admin_user());

-- 7. SECURE ADMIN RPCs (SECURITY DEFINER WITH IS_ADMIN CHECK)

-- A. admin_get_dashboard_stats()
CREATE OR REPLACE FUNCTION public.admin_get_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_users INT;
    v_pro_users INT;
    v_conversion_pct NUMERIC;
    v_reclaimed_hours NUMERIC;
    v_interceptions_today INT;
    v_chart_data JSONB;
    v_top_apps JSONB;
BEGIN
    IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Access Denied: Administrative privileges required';
    END IF;

    -- Total Users
    SELECT count(*) INTO v_total_users FROM public.profiles;

    -- Pro Subscribers
    SELECT count(*) INTO v_pro_users FROM public.profiles WHERE is_pro = true;

    -- Conversion %
    IF v_total_users > 0 THEN
        v_conversion_pct := round((v_pro_users::numeric / v_total_users::numeric) * 100, 1);
    ELSE
        v_conversion_pct := 0;
    END IF;

    -- Global Reclaimed Hours
    SELECT coalesce(round(sum(blocked_time_min)::numeric / 60.0, 1), 0)
    INTO v_reclaimed_hours
    FROM public.daily_metrics;

    -- Distractions Blocked Today
    SELECT coalesce(sum(interceptions_count), 0)
    INTO v_interceptions_today
    FROM public.daily_metrics
    WHERE metric_date = CURRENT_DATE;

    -- 14-day history chart
    SELECT coalesce(
        jsonb_agg(
            jsonb_build_object(
                'date', d.dt::text,
                'screen_time_hours', coalesce(round(m.total_screen / 60.0, 1), 0),
                'reclaimed_hours', coalesce(round(m.total_blocked / 60.0, 1), 0),
                'avg_score', coalesce(round(m.avg_focus), 100)
            ) ORDER BY d.dt ASC
        ),
        '[]'::jsonb
    ) INTO v_chart_data
    FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, INTERVAL '1 day') AS d(dt)
    LEFT JOIN (
        SELECT 
            metric_date,
            sum(total_screen_time_min) as total_screen,
            sum(blocked_time_min) as total_blocked,
            avg(focus_score) as avg_focus
        FROM public.daily_metrics
        WHERE metric_date >= CURRENT_DATE - INTERVAL '13 days'
        GROUP BY metric_date
    ) m ON m.metric_date = d.dt::date;

    -- Top Blocked Apps Leaderboard
    SELECT coalesce(
        jsonb_agg(
            jsonb_build_object(
                'display_name', display_name,
                'package_or_token', package_or_token,
                'platform', platform,
                'count', cnt
            ) ORDER BY cnt DESC
        ),
        '[]'::jsonb
    ) INTO v_top_apps
    FROM (
        SELECT display_name, package_or_token, platform, count(*) as cnt
        FROM public.blocked_targets
        GROUP BY display_name, package_or_token, platform
        ORDER BY cnt DESC
        LIMIT 6
    ) t;

    RETURN jsonb_build_object(
        'total_users', v_total_users,
        'pro_subscribers', v_pro_users,
        'conversion_percentage', v_conversion_pct,
        'total_reclaimed_hours', v_reclaimed_hours,
        'distractions_blocked_today', v_interceptions_today,
        'chart_14d', v_chart_data,
        'top_blocked_apps', v_top_apps
    );
END;
$$;

-- B. admin_set_user_pro(p_target_user_id text, p_is_pro bool)
CREATE OR REPLACE FUNCTION public.admin_set_user_pro(
    p_target_user_id TEXT,
    p_is_pro BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated public.profiles%ROWTYPE;
BEGIN
    IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Access Denied: Administrative privileges required';
    END IF;

    UPDATE public.profiles
    SET is_pro = p_is_pro,
        updated_at = now()
    WHERE id = p_target_user_id
    RETURNING * INTO v_updated;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found for id: %', p_target_user_id;
    END IF;

    -- Log action
    INSERT INTO public.webhook_logs (provider, event_type, user_id, status, payload)
    VALUES (
        'admin_portal',
        'ADMIN_SET_PRO',
        p_target_user_id,
        'success',
        jsonb_build_object('is_pro', p_is_pro, 'target_user_id', p_target_user_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_updated.id,
        'is_pro', v_updated.is_pro,
        'display_name', v_updated.display_name
    );
END;
$$;

-- C. admin_gift_gems(p_target_user_id text, p_gems_delta int)
CREATE OR REPLACE FUNCTION public.admin_gift_gems(
    p_target_user_id TEXT,
    p_gems_delta INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_gems INT;
    v_new_tier TEXT;
    v_updated public.profiles%ROWTYPE;
BEGIN
    IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Access Denied: Administrative privileges required';
    END IF;

    -- Calculate new balance
    SELECT greatest(0, total_gems + p_gems_delta) INTO v_new_gems
    FROM public.profiles
    WHERE id = p_target_user_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User profile not found for id: %', p_target_user_id;
    END IF;

    -- Recalculate tier
    IF v_new_gems >= 7500 THEN v_new_tier := 'Diamond';
    ELSIF v_new_gems >= 3500 THEN v_new_tier := 'Obsidian';
    ELSIF v_new_gems >= 1500 THEN v_new_tier := 'Gold';
    ELSIF v_new_gems >= 500 THEN v_new_tier := 'Silver';
    ELSE v_new_tier := 'Bronze';
    END IF;

    UPDATE public.profiles
    SET total_gems = v_new_gems,
        tier_rank = v_new_tier,
        updated_at = now()
    WHERE id = p_target_user_id
    RETURNING * INTO v_updated;

    -- Log action
    INSERT INTO public.webhook_logs (provider, event_type, user_id, status, payload)
    VALUES (
        'admin_portal',
        'ADMIN_GIFT_GEMS',
        p_target_user_id,
        'success',
        jsonb_build_object('delta', p_gems_delta, 'new_gems', v_new_gems, 'new_tier', v_new_tier)
    );

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_updated.id,
        'total_gems', v_updated.total_gems,
        'tier_rank', v_updated.tier_rank
    );
END;
$$;

-- D. admin_update_remote_config(p_key text, p_value jsonb)
CREATE OR REPLACE FUNCTION public.admin_update_remote_config(
    p_key TEXT,
    p_value JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_config public.app_remote_config%ROWTYPE;
BEGIN
    IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Access Denied: Administrative privileges required';
    END IF;

    INSERT INTO public.app_remote_config (key, value, updated_at)
    VALUES (p_key, p_value, now())
    ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value,
        updated_at = now()
    RETURNING * INTO v_config;

    -- Log action
    INSERT INTO public.webhook_logs (provider, event_type, user_id, status, payload)
    VALUES (
        'admin_portal',
        'ADMIN_UPDATE_REMOTE_CONFIG',
        NULL,
        'success',
        jsonb_build_object('key', p_key, 'new_value', p_value)
    );

    RETURN jsonb_build_object(
        'success', true,
        'key', v_config.key,
        'value', v_config.value,
        'updated_at', v_config.updated_at
    );
END;
$$;
