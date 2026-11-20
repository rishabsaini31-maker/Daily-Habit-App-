import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import oAuthService from '../oauth/OAuthService';

// Configuration from environment variables or production fallback endpoints
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://extmmwjtdmrwmminyekq.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_6W-PYLuF4q4tveYpTRtrLg_hqH8PLxP';

/**
 * Production Supabase Client configured with Direct OAuth:
 * - Uses custom `accessToken` callback to supply valid Google / Apple OAuth ID tokens
 * - Automatically refreshes expired tokens in the background before every request
 * - Preserves frictionless onboarding using local `device_guest_id` JWT
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  accessToken: async () => {
    return await oAuthService.getValidIdToken();
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

export default supabase;
