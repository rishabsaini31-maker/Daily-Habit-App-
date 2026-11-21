-- ==============================================================================
-- MIGRATION 006: APP LIMITS, CUSTOM APPS & 24-HOUR DAILY USAGE CYCLES
-- Enables per-app daily time allowance (e.g. 20m, 30m, 1h) and 24h midnight-to-midnight reset
-- ==============================================================================

-- 1. ADD APP USAGE LIMIT COLUMNS TO BLOCKED_TARGETS
ALTER TABLE public.blocked_targets
  ADD COLUMN IF NOT EXISTS daily_limit_minutes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_spent_today_minutes INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'social',
  ADD COLUMN IF NOT EXISTS last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Create index for faster user-specific target lookups
CREATE INDEX IF NOT EXISTS idx_blocked_targets_user_date
  ON public.blocked_targets (user_id, last_reset_date);

-- 2. RPC: SET DAILY APP USAGE LIMIT
CREATE OR REPLACE FUNCTION public.set_app_daily_limit(
    p_package_or_token TEXT,
    p_daily_limit_minutes INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id TEXT;
    v_target RECORD;
BEGIN
    v_user_id := coalesce(
        auth.jwt() ->> 'sub',
        current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    );

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: OAuth JWT sub claim required';
    END IF;

    UPDATE public.blocked_targets
    SET daily_limit_minutes = GREATEST(0, p_daily_limit_minutes)
    WHERE user_id = v_user_id
      AND package_or_token = p_package_or_token
    RETURNING * INTO v_target;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Blocked target not found for user'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'package_or_token', v_target.package_or_token,
        'daily_limit_minutes', v_target.daily_limit_minutes,
        'time_spent_today_minutes', v_target.time_spent_today_minutes
    );
END;
$$;

-- 3. RPC: RECORD APP USAGE & ENFORCE 24-HOUR (12 AM to 12 AM) CYCLE
CREATE OR REPLACE FUNCTION public.record_app_usage(
    p_package_or_token TEXT,
    p_minutes_used INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id TEXT;
    v_target RECORD;
    v_new_spent INT;
    v_is_limit_reached BOOLEAN := false;
BEGIN
    v_user_id := coalesce(
        auth.jwt() ->> 'sub',
        current_setting('request.jwt.claims', true)::jsonb ->> 'sub'
    );

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: OAuth JWT sub claim required';
    END IF;

    SELECT * INTO v_target
    FROM public.blocked_targets
    WHERE user_id = v_user_id
      AND package_or_token = p_package_or_token;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Target not found'
        );
    END IF;

    -- 24-Hour Cycle Check: If last reset was before today (past 12:00 AM midnight), reset usage to 0 first!
    IF v_target.last_reset_date < CURRENT_DATE THEN
        v_new_spent := GREATEST(0, p_minutes_used);
        UPDATE public.blocked_targets
        SET time_spent_today_minutes = v_new_spent,
            last_reset_date = CURRENT_DATE
        WHERE user_id = v_user_id
          AND package_or_token = p_package_or_token;
    ELSE
        v_new_spent := v_target.time_spent_today_minutes + GREATEST(0, p_minutes_used);
        UPDATE public.blocked_targets
        SET time_spent_today_minutes = v_new_spent
        WHERE user_id = v_user_id
          AND package_or_token = p_package_or_token;
    END IF;

    -- Evaluate if limit reached
    IF v_target.daily_limit_minutes > 0 AND v_new_spent >= v_target.daily_limit_minutes THEN
        v_is_limit_reached := true;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'package_or_token', p_package_or_token,
        'time_spent_today_minutes', v_new_spent,
        'daily_limit_minutes', v_target.daily_limit_minutes,
        'is_limit_reached', v_is_limit_reached,
        'reset_cycle', '12:00 AM to 12:00 AM'
    );
END;
$$;

-- 4. RPC: ATOMIC RESET OF 24-HOUR CYCLE (Runs automatically or via scheduled trigger)
CREATE OR REPLACE FUNCTION public.reset_daily_cycle_limits()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INT;
BEGIN
    UPDATE public.blocked_targets
    SET time_spent_today_minutes = 0,
        last_reset_date = CURRENT_DATE
    WHERE last_reset_date < CURRENT_DATE;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'success', true,
        'reset_count', v_count,
        'cycle_date', CURRENT_DATE
    );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.set_app_daily_limit(TEXT, INT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_app_usage(TEXT, INT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_daily_cycle_limits() TO anon, authenticated, service_role;
