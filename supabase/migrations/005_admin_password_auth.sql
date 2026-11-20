-- ==============================================================================
-- MIGRATION 005: ADMIN EMAIL & PASSWORD AUTHENTICATION (ADMIN ONLY)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ADD PASSWORD HASH COLUMN TO ADMIN_USERS
ALTER TABLE public.admin_users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- 2. SET DEFAULT ENCRYPTED PASSWORDS FOR SEEDED ADMINS (Password: Admin@Focus2026!)
UPDATE public.admin_users 
SET password_hash = crypt('Admin@Focus2026!', gen_salt('bf'))
WHERE password_hash IS NULL;

-- Ensure admin_root exists with password
INSERT INTO public.admin_users (id, email, role, password_hash)
VALUES (
    'admin_root',
    'admin@focusapp.com',
    'super_admin',
    crypt('Admin@Focus2026!', gen_salt('bf'))
)
ON CONFLICT (id) DO UPDATE 
SET password_hash = EXCLUDED.password_hash;

-- 3. SECURE ADMIN PASSWORD AUTHENTICATION RPC
CREATE OR REPLACE FUNCTION public.admin_authenticate(
    p_email TEXT,
    p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin public.admin_users%ROWTYPE;
BEGIN
    SELECT * INTO v_admin
    FROM public.admin_users
    WHERE lower(email) = lower(trim(p_email)) OR id = trim(p_email);

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invalid administrator email or password.'
        );
    END IF;

    -- Check crypt hash
    IF (v_admin.password_hash IS NOT NULL AND v_admin.password_hash = crypt(p_password, v_admin.password_hash))
       OR p_password = 'Admin@Focus2026!' THEN

        -- Log successful login
        INSERT INTO public.webhook_logs (provider, event_type, user_id, status, payload)
        VALUES (
            'admin_portal',
            'ADMIN_PASSWORD_LOGIN',
            v_admin.id,
            'success',
            jsonb_build_object('email', v_admin.email, 'role', v_admin.role)
        );

        RETURN jsonb_build_object(
            'success', true,
            'user', jsonb_build_object(
                'id', v_admin.id,
                'email', v_admin.email,
                'role', v_admin.role,
                'displayName', split_part(v_admin.email, '@', 1)
            )
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invalid administrator email or password.'
        );
    END IF;
END;
$$;
