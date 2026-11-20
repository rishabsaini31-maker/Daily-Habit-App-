import { User, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from './client';

const ANONYMOUS_FLAG_KEY = '@focus_user_is_anonymous';

export interface UserProfile {
  id: string;
  display_name: string;
  streak_days: number;
  total_gems: number;
  tier_rank: string;
  daily_baseline_minutes: number;
  is_pro: boolean;
  friend_partner_name?: string;
  friend_partner_contact?: string;
  nfc_tag_uid?: string;
}

class AuthService {
  /**
   * Initializes auth on app launch:
   * If no existing session exists, seamlessly creates an anonymous user
   * so onboarding and native app blocking begin immediately with zero friction.
   */
  async initializeOrGetSession(): Promise<{ user: User | null; session: Session | null }> {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn('Error reading session:', sessionError.message);
      }

      if (sessionData?.session?.user) {
        return { user: sessionData.session.user, session: sessionData.session };
      }

      // No active session: Sign in anonymously
      return await this.signInAnonymously();
    } catch (err) {
      console.warn('Auth initialize error, using local fallback:', err);
      return { user: null, session: null };
    }
  }

  async signInAnonymously(): Promise<{ user: User | null; session: Session | null }> {
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        // If Supabase project doesn't have anonymous auth enabled yet, fallback to offline guest identity
        console.warn('Supabase signInAnonymously failed or disabled:', error.message);
        return { user: null, session: null };
      }

      await AsyncStorage.setItem(ANONYMOUS_FLAG_KEY, 'true');
      return { user: data.user, session: data.session };
    } catch (err) {
      console.warn('Anonymous sign-in exception:', err);
      return { user: null, session: null };
    }
  }

  /**
   * Links an anonymous guest session with Apple Sign-In
   */
  async linkWithApple(idToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'apple',
        token: idToken,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      await AsyncStorage.removeItem(ANONYMOUS_FLAG_KEY);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  /**
   * Links an anonymous guest session with Google Sign-In
   */
  async linkWithGoogle(idToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.auth.linkIdentity({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      await AsyncStorage.removeItem(ANONYMOUS_FLAG_KEY);
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  async isAnonymous(): Promise<boolean> {
    const isAnon = await AsyncStorage.getItem(ANONYMOUS_FLAG_KEY);
    return isAnon === 'true';
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(ANONYMOUS_FLAG_KEY);
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  }
}

export const authService = new AuthService();
export default authService;
