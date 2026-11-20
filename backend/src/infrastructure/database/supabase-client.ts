import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseClientManager {
  private static instance: SupabaseClient | null = null;

  public static getInstance(): SupabaseClient {
    if (!SupabaseClientManager.instance) {
      const supabaseUrl =
        process.env.SUPABASE_URL || 'https://extmmwjtdmrwmminyekq.supabase.co';
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
      }

      SupabaseClientManager.instance = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }

    return SupabaseClientManager.instance;
  }
}

export default SupabaseClientManager;
