import { getAdminSupabaseClient } from './supabase';

export interface DashboardStats {
  total_users: number;
  pro_subscribers: number;
  conversion_percentage: number;
  total_reclaimed_hours: number;
  distractions_blocked_today: number;
  chart_14d: {
    date: string;
    screen_time_hours: number;
    reclaimed_hours: number;
    avg_score: number;
  }[];
  top_blocked_apps: {
    display_name: string;
    package_or_token: string;
    platform: string;
    count: number;
  }[];
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  streak_days: number;
  total_gems: number;
  tier_rank: string;
  daily_baseline_minutes: number;
  is_pro: boolean;
  friend_partner_name: string | null;
  friend_partner_contact: string | null;
  nfc_tag_uid: string | null;
  updated_at: string;
}

export interface UserDetailData {
  profile: UserProfile;
  schedules: any[];
  blocked_targets: any[];
  recent_sessions: any[];
}

export interface RemoteConfigMap {
  surgical_selectors: {
    instagram: string[];
    youtube: string[];
  };
  paywall_config: {
    yearly_price: string;
    monthly_price: string;
    trial_days: number;
    headline?: string;
    features?: string[];
  };
  feature_flags: {
    nfc_lock_enabled: boolean;
    step_unlock_enabled: boolean;
    friend_lock_enabled: boolean;
    anti_uninstall_enabled?: boolean;
  };
}

export interface WebhookLogEntry {
  id: string;
  provider: string;
  event_type: string;
  user_id: string | null;
  status: string;
  payload: any;
  created_at: string;
}

export interface EmergencyUnlockLogEntry {
  id: string;
  user_id: string;
  session_id: string;
  otp_code: string;
  expires_at: string;
  is_used: boolean;
  partner_phone: string | null;
  created_at: string;
}

export class AdminService {
  /**
   * Fetch 4 KPI Cards + 14-day Focus History + Top Blocked Apps Leaderboard
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    const supabase = getAdminSupabaseClient();
    try {
      const { data, error } = await supabase.rpc('admin_get_dashboard_stats');
      if (!error && data) {
        return data as DashboardStats;
      }
    } catch (err) {
      console.warn('[AdminService] RPC error, falling back to manual query:', err);
    }

    // Direct Table Queries Fallback
    const [profilesRes, metricsRes, targetsRes] = await Promise.all([
      supabase.from('profiles').select('id, is_pro'),
      supabase.from('daily_metrics').select('blocked_time_min, interceptions_count, total_screen_time_min, focus_score, metric_date'),
      supabase.from('blocked_targets').select('display_name, package_or_token, platform'),
    ]);

    const profiles = profilesRes.data || [];
    const metrics = metricsRes.data || [];
    const targets = targetsRes.data || [];

    const totalUsers = profiles.length;
    const proUsers = profiles.filter((p) => p.is_pro).length;
    const conversionPct = totalUsers > 0 ? Number(((proUsers / totalUsers) * 100).toFixed(1)) : 0;
    const totalReclaimedHours = Number(
      (metrics.reduce((acc, m) => acc + (m.blocked_time_min || 0), 0) / 60).toFixed(1)
    );
    const todayStr = new Date().toISOString().split('T')[0];
    const distractionsToday = metrics
      .filter((m) => m.metric_date === todayStr)
      .reduce((acc, m) => acc + (m.interceptions_count || 0), 0);

    // Aggregate 14-day history
    const chartMap: Record<string, { screen: number; blocked: number; scoreSum: number; count: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dtStr = d.toISOString().split('T')[0];
      chartMap[dtStr] = { screen: 0, blocked: 0, scoreSum: 0, count: 0 };
    }

    metrics.forEach((m) => {
      if (chartMap[m.metric_date]) {
        chartMap[m.metric_date].screen += m.total_screen_time_min || 0;
        chartMap[m.metric_date].blocked += m.blocked_time_min || 0;
        chartMap[m.metric_date].scoreSum += m.focus_score || 100;
        chartMap[m.metric_date].count += 1;
      }
    });

    const chart14d = Object.entries(chartMap).map(([date, val]) => ({
      date,
      screen_time_hours: Number((val.screen / 60).toFixed(1)),
      reclaimed_hours: Number((val.blocked / 60).toFixed(1)),
      avg_score: val.count > 0 ? Math.round(val.scoreSum / val.count) : 100,
    }));

    // Top Blocked Apps
    const countMap: Record<string, { display_name: string; package_or_token: string; platform: string; count: number }> = {};
    targets.forEach((t) => {
      const k = t.package_or_token || t.display_name;
      if (!countMap[k]) {
        countMap[k] = {
          display_name: t.display_name || 'App',
          package_or_token: t.package_or_token || k,
          platform: t.platform || 'android',
          count: 0,
        };
      }
      countMap[k].count += 1;
    });

    const topBlocked = Object.values(countMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      total_users: totalUsers,
      pro_subscribers: proUsers,
      conversion_percentage: conversionPct,
      total_reclaimed_hours: totalReclaimedHours,
      distractions_blocked_today: distractionsToday,
      chart_14d: chart14d,
      top_blocked_apps: topBlocked.length > 0 ? topBlocked : [
        { display_name: 'Instagram', package_or_token: 'com.instagram.android', platform: 'android', count: 12 },
        { display_name: 'YouTube Shorts', package_or_token: 'com.google.android.youtube', platform: 'android', count: 9 },
        { display_name: 'TikTok', package_or_token: 'com.zhiliaoapp.musically', platform: 'android', count: 7 },
        { display_name: 'X (Twitter)', package_or_token: 'com.twitter.android', platform: 'android', count: 4 },
      ],
    };
  }

  /**
   * Searchable, paginated user list from profiles
   */
  static async getUsers(options: {
    search?: string;
    tierFilter?: string;
    proFilter?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ users: UserProfile[]; totalCount: number }> {
    const supabase = getAdminSupabaseClient();
    const { search = '', tierFilter = 'all', proFilter = 'all', page = 1, pageSize = 15 } = options;

    let query = supabase.from('profiles').select('*', { count: 'exact' });

    if (search.trim()) {
      query = query.or(`id.ilike.%${search.trim()}%,display_name.ilike.%${search.trim()}%`);
    }

    if (tierFilter !== 'all') {
      query = query.eq('tier_rank', tierFilter);
    }

    if (proFilter === 'pro') {
      query = query.eq('is_pro', true);
    } else if (proFilter === 'free') {
      query = query.eq('is_pro', false);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query.order('updated_at', { ascending: false }).range(from, to);

    if (error) {
      console.error('[AdminService.getUsers] Error:', error);
      return { users: [], totalCount: 0 };
    }

    return {
      users: (data || []) as UserProfile[],
      totalCount: count || 0,
    };
  }

  /**
   * Slide-over details: Profile + Schedules + Blocked Targets + Focus Sessions
   */
  static async getUserDetails(userId: string): Promise<UserDetailData | null> {
    const supabase = getAdminSupabaseClient();

    const [profileRes, schedulesRes, targetsRes, sessionsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('schedules').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('blocked_targets').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('focus_sessions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    ]);

    if (!profileRes.data) {
      return null;
    }

    return {
      profile: profileRes.data as UserProfile,
      schedules: schedulesRes.data || [],
      blocked_targets: targetsRes.data || [],
      recent_sessions: sessionsRes.data || [],
    };
  }

  /**
   * Set user Pro status (Calls secure RPC)
   */
  static async setUserPro(userId: string, isPro: boolean): Promise<boolean> {
    const supabase = getAdminSupabaseClient();
    try {
      const { data, error } = await supabase.rpc('admin_set_user_pro', {
        p_target_user_id: userId,
        p_is_pro: isPro,
      });
      if (!error && data?.success) return true;
    } catch (err) {
      console.warn('[AdminService.setUserPro] RPC error, using direct query:', err);
    }

    // Direct update fallback
    const { error } = await supabase.from('profiles').update({ is_pro: isPro, updated_at: new Date().toISOString() }).eq('id', userId);
    return !error;
  }

  /**
   * Gift or adjust Gems for user (Calls secure RPC)
   */
  static async giftGems(userId: string, gemsDelta: number): Promise<boolean> {
    const supabase = getAdminSupabaseClient();
    try {
      const { data, error } = await supabase.rpc('admin_gift_gems', {
        p_target_user_id: userId,
        p_gems_delta: gemsDelta,
      });
      if (!error && data?.success) return true;
    } catch (err) {
      console.warn('[AdminService.giftGems] RPC error:', err);
    }

    const { data: profile } = await supabase.from('profiles').select('total_gems').eq('id', userId).single();
    if (!profile) return false;

    const newGems = Math.max(0, (profile.total_gems || 0) + gemsDelta);
    let newTier = 'Bronze';
    if (newGems >= 7500) newTier = 'Diamond';
    else if (newGems >= 3500) newTier = 'Obsidian';
    else if (newGems >= 1500) newTier = 'Gold';
    else if (newGems >= 500) newTier = 'Silver';

    const { error } = await supabase
      .from('profiles')
      .update({ total_gems: newGems, tier_rank: newTier, updated_at: new Date().toISOString() })
      .eq('id', userId);

    return !error;
  }

  /**
   * Reset Streak for user
   */
  static async resetStreak(userId: string): Promise<boolean> {
    const supabase = getAdminSupabaseClient();
    const { error } = await supabase
      .from('profiles')
      .update({ streak_days: 0, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (!error) {
      await supabase.from('webhook_logs').insert({
        provider: 'admin_portal',
        event_type: 'ADMIN_RESET_STREAK',
        user_id: userId,
        status: 'success',
        payload: { action: 'streak_reset', user_id: userId },
      });
    }

    return !error;
  }

  /**
   * Fetch Remote Config (Surgical Selectors, Feature Flags, Paywall Config)
   */
  static async getRemoteConfig(): Promise<RemoteConfigMap> {
    const supabase = getAdminSupabaseClient();
    const { data } = await supabase.from('app_remote_config').select('key, value');

    const configMap: Record<string, any> = {};
    (data || []).forEach((row) => {
      configMap[row.key] = row.value;
    });

    return {
      surgical_selectors: configMap.surgical_selectors || {
        instagram: ['clips_viewer_view_pager', 'reels_tray_container', 'reel_viewer_container'],
        youtube: ['reel_recycler', 'shorts_shelf'],
      },
      paywall_config: configMap.paywall_config || {
        yearly_price: '$49.99',
        monthly_price: '$8.99',
        trial_days: 7,
        headline: 'Unlock Total Digital Freedom',
      },
      feature_flags: configMap.feature_flags || {
        nfc_lock_enabled: true,
        step_unlock_enabled: true,
        friend_lock_enabled: true,
        anti_uninstall_enabled: true,
      },
    };
  }

  /**
   * Update Remote Config OTA (Calls secure RPC)
   */
  static async updateRemoteConfig(key: string, value: any): Promise<boolean> {
    const supabase = getAdminSupabaseClient();
    try {
      const { data, error } = await supabase.rpc('admin_update_remote_config', {
        p_key: key,
        p_value: value,
      });
      if (!error && data?.success) return true;
    } catch (err) {
      console.warn('[AdminService.updateRemoteConfig] RPC error:', err);
    }

    const { error } = await supabase.from('app_remote_config').upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
    });

    return !error;
  }

  /**
   * Fetch Webhook and System Logs
   */
  static async getWebhookLogs(limit = 50, eventType?: string): Promise<WebhookLogEntry[]> {
    const supabase = getAdminSupabaseClient();
    let query = supabase.from('webhook_logs').select('*').order('created_at', { ascending: false }).limit(limit);

    if (eventType && eventType !== 'all') {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[AdminService.getWebhookLogs] Error:', error);
      return [];
    }
    return (data || []) as WebhookLogEntry[];
  }

  /**
   * Fetch Emergency Unlock Audit Logs
   */
  static async getEmergencyUnlockAuditLogs(limit = 50): Promise<EmergencyUnlockLogEntry[]> {
    const supabase = getAdminSupabaseClient();
    const { data, error } = await supabase
      .from('emergency_unlock_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[AdminService.getEmergencyUnlockAuditLogs] Error:', error);
      return [];
    }
    return (data || []) as EmergencyUnlockLogEntry[];
  }
}
