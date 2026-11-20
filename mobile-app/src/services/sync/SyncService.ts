import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase/client';
import { UserProfile } from '../supabase/auth';

const STORAGE_KEYS = {
  PROFILE: '@local_cache_profile',
  BLOCKED_TARGETS: '@local_cache_blocked_targets',
  ACTIVE_SESSION: '@local_cache_active_session',
  PAST_SESSIONS: '@local_cache_past_sessions',
  SCHEDULES: '@local_cache_schedules',
  DAILY_METRICS: '@local_cache_daily_metrics',
  MUTATION_QUEUE: '@local_sync_mutation_queue',
};

export interface SyncBlockedTarget {
  id: string;
  user_id?: string;
  platform: 'ios' | 'android';
  package_or_token: string;
  display_name: string;
  is_surgical_feed_only: boolean;
  created_at?: string;
}

export interface SyncFocusSession {
  id: string;
  user_id?: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  strictness_mode: 'normal' | 'deep_focus' | 'friend_or_nfc';
  status: 'active' | 'completed' | 'broken';
  time_saved_minutes: number;
}

export interface SyncSchedule {
  id: string;
  user_id?: string;
  title: string;
  trigger_type: 'time' | 'geofence' | 'health_steps';
  days_of_week: number[];
  start_time?: string;
  end_time?: string;
  geofence_lat?: number;
  geofence_lng?: number;
  geofence_radius_m?: number;
  step_goal?: number;
  is_active: boolean;
}

export interface SyncDailyMetric {
  id?: string;
  user_id?: string;
  metric_date: string;
  focus_score: number;
  total_screen_time_min: number;
  blocked_time_min: number;
  interceptions_count: number;
  gems_earned: number;
}

export interface MutationTask {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete' | 'upsert';
  payload: Record<string, unknown>;
  createdAt: number;
}

class SyncService {
  private isSyncing = false;
  private listeners: (() => void)[] = [];

  // ==========================================
  // PROFILE CACHE & SYNC
  // ==========================================
  async getProfile(): Promise<UserProfile> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE);
      if (cached) return JSON.parse(cached);
    } catch {
      // fallback
    }

    const defaultProfile: UserProfile = {
      id: 'local-user',
      display_name: 'Focus Pioneer',
      streak_days: 7,
      total_gems: 480,
      tier_rank: 'Bronze',
      daily_baseline_minutes: 270,
      is_pro: false,
      friend_partner_name: 'Alex',
      friend_partner_contact: '+1234567890',
      nfc_tag_uid: '04:5A:21:7B:9C',
    };
    await this.setProfileLocal(defaultProfile);
    return defaultProfile;
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const current = await this.getProfile();
    const updated: UserProfile = { ...current, ...updates };
    await this.setProfileLocal(updated);

    this.queueMutation('profiles', 'upsert', updated as unknown as Record<string, unknown>);
    return updated;
  }

  private async setProfileLocal(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    this.notifyListeners();
  }

  // ==========================================
  // BLOCKED TARGETS (0ms Local Blocker Response)
  // ==========================================
  async getBlockedTargets(): Promise<SyncBlockedTarget[]> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.BLOCKED_TARGETS);
      if (cached) return JSON.parse(cached);
    } catch {
      // fallback
    }

    // Default seed targets
    const defaults: SyncBlockedTarget[] = [
      {
        id: '1',
        platform: 'android',
        package_or_token: 'com.instagram.android',
        display_name: 'Instagram',
        is_surgical_feed_only: true,
      },
      {
        id: '2',
        platform: 'android',
        package_or_token: 'com.google.android.youtube',
        display_name: 'YouTube',
        is_surgical_feed_only: true,
      },
      {
        id: '3',
        platform: 'android',
        package_or_token: 'com.zhiliaoapp.musically',
        display_name: 'TikTok',
        is_surgical_feed_only: false,
      },
      {
        id: '4',
        platform: 'android',
        package_or_token: 'com.twitter.android',
        display_name: 'X (Twitter)',
        is_surgical_feed_only: false,
      },
    ];
    await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_TARGETS, JSON.stringify(defaults));
    return defaults;
  }

  async saveBlockedTargets(targets: SyncBlockedTarget[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_TARGETS, JSON.stringify(targets));
    this.notifyListeners();

    // Sync to Supabase in background
    for (const target of targets) {
      this.queueMutation('blocked_targets', 'upsert', target as unknown as Record<string, unknown>);
    }
  }

  async addBlockedTarget(target: SyncBlockedTarget): Promise<void> {
    const targets = await this.getBlockedTargets();
    const filtered = targets.filter((t) => t.package_or_token !== target.package_or_token);
    filtered.push(target);
    await this.saveBlockedTargets(filtered);
  }

  async removeBlockedTarget(packageOrToken: string): Promise<void> {
    const targets = await this.getBlockedTargets();
    const filtered = targets.filter((t) => t.package_or_token !== packageOrToken);
    await this.saveBlockedTargets(filtered);
    this.queueMutation('blocked_targets', 'delete', { package_or_token: packageOrToken });
  }

  // ==========================================
  // SCHEDULES
  // ==========================================
  async getSchedules(): Promise<SyncSchedule[]> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULES);
      if (cached) return JSON.parse(cached);
    } catch {
      // fallback
    }

    const defaultSchedules: SyncSchedule[] = [
      {
        id: 'sched-1',
        title: 'Work Focus Block',
        trigger_type: 'time',
        days_of_week: [1, 2, 3, 4, 5],
        start_time: '09:00:00',
        end_time: '17:00:00',
        is_active: true,
      },
      {
        id: 'sched-2',
        title: 'Sleep Sanctuary',
        trigger_type: 'time',
        days_of_week: [1, 2, 3, 4, 5, 6, 7],
        start_time: '22:30:00',
        end_time: '07:00:00',
        is_active: true,
      },
      {
        id: 'sched-3',
        title: 'Office / Work HQ',
        trigger_type: 'geofence',
        days_of_week: [1, 2, 3, 4, 5],
        geofence_lat: 37.7749,
        geofence_lng: -122.4194,
        geofence_radius_m: 200,
        is_active: true,
      },
      {
        id: 'sched-4',
        title: 'Physical Activity Gating',
        trigger_type: 'health_steps',
        days_of_week: [1, 2, 3, 4, 5, 6, 7],
        step_goal: 5000,
        is_active: true,
      },
    ];
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(defaultSchedules));
    return defaultSchedules;
  }

  async saveSchedules(schedules: SyncSchedule[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULES, JSON.stringify(schedules));
    this.notifyListeners();
    for (const s of schedules) {
      this.queueMutation('schedules', 'upsert', s as unknown as Record<string, unknown>);
    }
  }

  async toggleSchedule(id: string, isActive: boolean): Promise<void> {
    const schedules = await this.getSchedules();
    const updated = schedules.map((s) => (s.id === id ? { ...s, is_active: isActive } : s));
    await this.saveSchedules(updated);
  }

  // ==========================================
  // FOCUS SESSIONS
  // ==========================================
  async getActiveSession(): Promise<SyncFocusSession | null> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      if (cached) {
        const session: SyncFocusSession = JSON.parse(cached);
        const expiresAt = new Date(session.end_time).getTime();
        if (Date.now() > expiresAt) {
          // Session expired naturally
          await this.completeSession(session.id);
          return null;
        }
        return session;
      }
    } catch {
      // fallback
    }
    return null;
  }

  async startSession(session: SyncFocusSession): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
    this.notifyListeners();
    this.queueMutation('focus_sessions', 'insert', session as unknown as Record<string, unknown>);
  }

  async completeSession(sessionId: string): Promise<void> {
    const active = await this.getActiveSession();
    if (active && active.id === sessionId) {
      const completedSession: SyncFocusSession = {
        ...active,
        status: 'completed',
        time_saved_minutes: active.duration_minutes,
      };
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);

      // Save to past sessions
      const past = await this.getPastSessions();
      past.unshift(completedSession);
      await AsyncStorage.setItem(STORAGE_KEYS.PAST_SESSIONS, JSON.stringify(past.slice(0, 50)));

      this.notifyListeners();
      this.queueMutation('focus_sessions', 'update', {
        id: sessionId,
        status: 'completed',
        time_saved_minutes: active.duration_minutes,
      });
    }
  }

  async cancelSessionEarly(sessionId: string): Promise<void> {
    const active = await this.getActiveSession();
    if (active && active.id === sessionId) {
      const brokenSession: SyncFocusSession = {
        ...active,
        status: 'broken',
      };
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      this.notifyListeners();
      this.queueMutation('focus_sessions', 'update', {
        id: sessionId,
        status: 'broken',
      });
    }
  }

  async getPastSessions(): Promise<SyncFocusSession[]> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.PAST_SESSIONS);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }

  // ==========================================
  // DAILY METRICS
  // ==========================================
  async getTodayMetrics(): Promise<SyncDailyMetric> {
    const todayStr = new Date().toISOString().split('T')[0];
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_METRICS);
      if (cached) {
        const metrics: SyncDailyMetric = JSON.parse(cached);
        if (metrics.metric_date === todayStr) {
          return metrics;
        }
      }
    } catch {
      // fallback
    }

    const newDayMetrics: SyncDailyMetric = {
      metric_date: todayStr,
      focus_score: 88,
      total_screen_time_min: 135,
      blocked_time_min: 108,
      interceptions_count: 48,
      gems_earned: 35,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_METRICS, JSON.stringify(newDayMetrics));
    return newDayMetrics;
  }

  async updateTodayMetrics(updates: Partial<SyncDailyMetric>): Promise<SyncDailyMetric> {
    const current = await this.getTodayMetrics();
    const updated: SyncDailyMetric = { ...current, ...updates };
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_METRICS, JSON.stringify(updated));
    this.notifyListeners();

    this.queueMutation('daily_metrics', 'upsert', updated as unknown as Record<string, unknown>);
    return updated;
  }

  // ==========================================
  // BACKGROUND MUTATION QUEUE & ONLINE SYNC
  // ==========================================
  private async queueMutation(
    table: string,
    action: 'insert' | 'update' | 'delete' | 'upsert',
    payload: Record<string, unknown>
  ): Promise<void> {
    const task: MutationTask = {
      id: Math.random().toString(36).substring(2, 9),
      table,
      action,
      payload,
      createdAt: Date.now(),
    };

    try {
      const rawQueue = await AsyncStorage.getItem(STORAGE_KEYS.MUTATION_QUEUE);
      const queue: MutationTask[] = rawQueue ? JSON.parse(rawQueue) : [];
      queue.push(task);
      await AsyncStorage.setItem(STORAGE_KEYS.MUTATION_QUEUE, JSON.stringify(queue));
    } catch {
      // ignore
    }

    // Trigger non-blocking background flush
    this.flushMutationQueue().catch(() => {});
  }

  async flushMutationQueue(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) {
        this.isSyncing = false;
        return; // Not logged in yet
      }

      const rawQueue = await AsyncStorage.getItem(STORAGE_KEYS.MUTATION_QUEUE);
      if (!rawQueue) {
        this.isSyncing = false;
        return;
      }

      const queue: MutationTask[] = JSON.parse(rawQueue);
      if (queue.length === 0) {
        this.isSyncing = false;
        return;
      }

      const remainingQueue: MutationTask[] = [];

      for (const task of queue) {
        try {
          const payloadWithUser = { ...task.payload, user_id: user.id };

          if (task.action === 'upsert' || task.action === 'insert') {
            await supabase.from(task.table).upsert(payloadWithUser);
          } else if (task.action === 'update' && task.payload.id) {
            await supabase.from(task.table).update(task.payload).eq('id', task.payload.id);
          } else if (task.action === 'delete') {
            if (task.payload.id) {
              await supabase.from(task.table).delete().eq('id', task.payload.id);
            } else if (task.payload.package_or_token) {
              await supabase
                .from(task.table)
                .delete()
                .eq('package_or_token', task.payload.package_or_token);
            }
          }
        } catch {
          // If remote fails (e.g. offline), retain in queue
          remainingQueue.push(task);
        }
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.MUTATION_QUEUE,
        JSON.stringify(remainingQueue)
      );
    } catch {
      // Offline / network failure
    } finally {
      this.isSyncing = false;
    }
  }

  // ==========================================
  // REALTIME SUBSCRIPTIONS
  // ==========================================
  setupRealtimeSubscriptions(userId: string) {
    const channel = supabase
      .channel('user_sync_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'blocked_targets', filter: `user_id=eq.${userId}` },
        async () => {
          // Refresh remote changes into local cache
          const { data } = await supabase
            .from('blocked_targets')
            .select('*')
            .eq('user_id', userId);
          if (data && data.length > 0) {
            await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_TARGETS, JSON.stringify(data));
            this.notifyListeners();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'focus_sessions', filter: `user_id=eq.${userId}` },
        async () => {
          const { data } = await supabase
            .from('focus_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('start_time', { ascending: false })
            .limit(1);

          if (data && data.length > 0) {
            await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(data[0]));
            this.notifyListeners();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }
}

export const syncService = new SyncService();
export default syncService;
