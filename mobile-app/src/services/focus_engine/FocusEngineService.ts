import { AppState, AppStateStatus, Platform } from 'react-native';
import syncService, {
  SyncFocusSession,
  SyncDailyMetric,
  SyncSchedule,
  SyncBlockedTarget,
} from '../sync/SyncService';
import { UserProfile } from '../supabase/auth';
import nativeBlocker from '../native_blocker/NativeBlockerBridge';
import healthStepService from '../addons/HealthStepService';
import { api } from '../api';

export interface FocusEngineState {
  profile: UserProfile;
  activeSession: SyncFocusSession | null;
  remainingSeconds: number;
  formattedRemainingTime: string;
  focusScore: number;
  todayMetrics: SyncDailyMetric;
  schedules: SyncSchedule[];
  blockedTargets: SyncBlockedTarget[];
  isSessionActive: boolean;
  isLoading: boolean;
}

class FocusEngineService {
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: ((state: FocusEngineState) => void)[] = [];
  private state: FocusEngineState = {
    profile: {
      id: 'local-user',
      display_name: 'Focus Pioneer',
      streak_days: 0,
      total_gems: 0,
      tier_rank: 'Bronze',
      daily_baseline_minutes: 270,
      is_pro: false,
    },
    activeSession: null,
    remainingSeconds: 0,
    formattedRemainingTime: '00:00',
    focusScore: 100,
    todayMetrics: {
      metric_date: new Date().toISOString().split('T')[0],
      focus_score: 100,
      total_screen_time_min: 0,
      blocked_time_min: 0,
      interceptions_count: 0,
      gems_earned: 0,
    },
    schedules: [],
    blockedTargets: [],
    isSessionActive: false,
    isLoading: true,
  };

  constructor() {
    this.init();
  }

  async init() {
    // Fetch live OTA Remote Config (surgical node selectors & feature flags)
    try {
      const config = await syncService.fetchRemoteConfig();
      if (config?.surgical_selectors) {
        nativeBlocker.setRemoteSurgicalSelectors(config.surgical_selectors);
      }
    } catch (err) {
      console.warn('FocusEngineService remote config fetch warning:', err);
    }

    await this.refreshState();
    this.startTimerLoop();
    this.syncLiveAppUsageFromDevice();

    // Listen to foreground active state to immediately sync app usage time
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        this.syncLiveAppUsageFromDevice();
      }
    });

    // Listen to local sync changes
    syncService.subscribe(() => {
      this.refreshState();
    });
  }

  async refreshState(): Promise<FocusEngineState> {
    const [profile, activeSession, todayMetrics, schedules, blockedTargets] =
      await Promise.all([
        syncService.getProfile(),
        syncService.getActiveSession(),
        syncService.getTodayMetrics(),
        syncService.getSchedules(),
        syncService.getBlockedTargets(),
      ]);

    const remaining = this.calculateRemainingSeconds(activeSession);
    const pastSessions = await syncService.getPastSessions();
    const completedToday = pastSessions.filter((s) => s.status === 'completed').length;

    // Spec Formula: clamp(100 - ((distracting_minutes / daily_baseline_minutes) * 60) + (completed_sessions * 5), 0, 100)
    const baseline = profile.daily_baseline_minutes || 270;
    const distractingMin = todayMetrics.total_screen_time_min || 0;
    const computedScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(100 - (distractingMin / baseline) * 60 + completedToday * 5)
      )
    );

    this.state = {
      profile,
      activeSession,
      remainingSeconds: remaining,
      formattedRemainingTime: this.formatTime(remaining),
      focusScore: computedScore,
      todayMetrics: {
        ...todayMetrics,
        focus_score: computedScore,
      },
      schedules,
      blockedTargets,
      isSessionActive: activeSession !== null && remaining > 0,
      isLoading: false,
    };

    this.notify();
    return this.state;
  }

  // ==========================================
  // PERSISTENT TIMER SURVIVING KILLS & REBOOTS
  // ==========================================
  private calculateRemainingSeconds(session: SyncFocusSession | null): number {
    if (!session || !session.end_time) return 0;
    const endMs = new Date(session.end_time).getTime();
    const nowMs = Date.now();
    const diffSec = Math.max(0, Math.floor((endMs - nowMs) / 1000));
    return diffSec;
  }

  private timerTicks = 0;

  private startTimerLoop() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(async () => {
      this.timerTicks++;
      // Every 4 seconds, poll real-time foreground app usage from Android UsageStatsManager
      if (this.timerTicks % 4 === 0) {
        this.syncLiveAppUsageFromDevice().catch(() => {});
      }

      // Check 24-hour cycle boundary (resets at 12:00 AM midnight)
      syncService.checkAndReset24HourCycle();

      if (this.state.activeSession) {
        const remaining = this.calculateRemainingSeconds(this.state.activeSession);
        if (remaining <= 0) {
          // Session naturally completed! Award gems & complete
          await this.handleSessionNaturalCompletion(this.state.activeSession);
        } else {
          this.state.remainingSeconds = remaining;
          this.state.formattedRemainingTime = this.formatTime(remaining);
          this.notify();
        }
      }
    }, 1000);
  }

  /**
   * Synchronizes real hardware app usage from Android UsageStatsManager in real time.
   * If user uses Instagram for 5 minutes, updates blocked target's time_spent_today_minutes to 5m.
   */
  async syncLiveAppUsageFromDevice(): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
      const usageList = await nativeBlocker.getLiveAppUsage();
      if (!usageList || usageList.length === 0) return;

      const currentTargets = await syncService.getBlockedTargets();
      let hasChanges = false;

      for (const target of currentTargets) {
        const pkgLower = target.package_or_token.toLowerCase();
        const matched = usageList.find((u) => u.packageName.toLowerCase() === pkgLower);
        if (matched && typeof matched.minutes === 'number') {
          if (target.time_spent_today_minutes !== matched.minutes) {
            target.time_spent_today_minutes = matched.minutes;
            hasChanges = true;

            // Enforce limit if daily allowance is reached
            if (target.daily_limit_minutes && target.daily_limit_minutes > 0) {
              if (matched.minutes >= target.daily_limit_minutes) {
                nativeBlocker.toggleAppBlock(target.package_or_token, true).catch(() => {});
              }
            }
          }
        }
      }

      if (hasChanges) {
        const totalScreenTime = currentTargets.reduce(
          (sum, t) => sum + (t.time_spent_today_minutes || 0),
          0
        );
        const metrics = await syncService.getTodayMetrics();
        metrics.total_screen_time_min = totalScreenTime;

        await this.refreshState();
      }
    } catch (e) {
      console.warn('syncLiveAppUsageFromDevice error:', e);
    }
  }

  async createSchedule(schedule: SyncSchedule): Promise<void> {
    await syncService.createSchedule(schedule);
    await this.refreshState();
  }

  async deleteSchedule(id: string): Promise<void> {
    await syncService.deleteSchedule(id);
    await this.refreshState();
  }

  async setAppDailyLimit(packageOrToken: string, limitMinutes: number): Promise<void> {
    await syncService.setAppDailyLimit(packageOrToken, limitMinutes);
    await this.refreshState();
  }

  async recordAppUsage(
    packageOrToken: string,
    minutes: number
  ): Promise<{ isLimitReached: boolean; newSpent: number }> {
    const result = await syncService.recordAppUsage(packageOrToken, minutes);
    if (result.isLimitReached) {
      // Trigger system-level app blocking for this target for the rest of today's cycle
      nativeBlocker.toggleAppBlock(packageOrToken, true).catch(() => {});
    }
    await this.refreshState();
    return result;
  }

  private formatTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const mm = mins < 10 ? `0${mins}` : `${mins}`;
    const ss = secs < 10 ? `0${secs}` : `${secs}`;
    return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  // ==========================================
  // SESSION ACTIONS
  // ==========================================
  async startSession(
    title: string,
    durationMinutes: number,
    strictness: 'normal' | 'deep_focus' | 'friend_or_nfc' = 'normal'
  ): Promise<SyncFocusSession> {
    const now = new Date();
    const end = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const session: SyncFocusSession = {
      id: Math.random().toString(36).substring(2, 11),
      start_time: now.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: durationMinutes,
      strictness_mode: strictness,
      status: 'active',
      time_saved_minutes: 0,
    };

    await syncService.startSession(session);
    api.startFocusSession(durationMinutes, strictness, session.id).catch(() => {});

    // Enforce system-level native blocking on iOS & Android
    const strictnessMapped =
      strictness === 'deep_focus'
        ? 'hardcore'
        : strictness === 'friend_or_nfc'
        ? 'friend_lock'
        : 'normal';

    const blockedAppIds = this.state.blockedTargets.map((t) => t.package_or_token);
    await nativeBlocker.startFocusSession({
      id: session.id,
      title,
      durationMinutes,
      strictness: strictnessMapped,
      blockedAppIds: blockedAppIds.length > 0 ? blockedAppIds : ['com.instagram.android', 'com.google.android.youtube'],
      surgicalFeatureIds: ['reels', 'shorts', 'fyp'],
      autoDoNotDisturb: true,
    });

    if (strictness === 'deep_focus') {
      await nativeBlocker.setAntiUninstallGuard(true);
    }

    await this.refreshState();
    return session;
  }

  async stopSessionEarly(emergencyCode?: string): Promise<{ success: boolean; reason?: string }> {
    const active = this.state.activeSession;
    if (!active) return { success: true };

    if (active.strictness_mode === 'deep_focus') {
      return {
        success: false,
        reason: 'Deep Focus Mode is locked. Anti-bypass protection is active.',
      };
    }

    if (active.strictness_mode === 'friend_or_nfc') {
      if (emergencyCode !== '778899') {
        return {
          success: false,
          reason: 'Invalid partner unlock code. Emergency code required.',
        };
      }
    }

    await syncService.cancelSessionEarly(active.id);
    api.stopFocusSessionEarly(active.id).catch(() => {});
    await nativeBlocker.stopFocusSession(emergencyCode);
    await nativeBlocker.setAntiUninstallGuard(false);
    await this.refreshState();
    return { success: true };
  }

  // ==========================================
  // REWARDS & GAMIFICATION ENGINE
  // ==========================================
  private async handleSessionNaturalCompletion(session: SyncFocusSession) {
    await syncService.completeSession(session.id, session.duration_minutes);
    api.completeFocusSession(session.id, session.duration_minutes).catch(() => {});
    await nativeBlocker.stopFocusSession();
    await nativeBlocker.setAntiUninstallGuard(false);

    // Spec: +10 Gems per 30 mins of completed Deep Focus
    const gemsAwarded = Math.max(10, Math.floor(session.duration_minutes / 30) * 10);
    await this.awardGems(gemsAwarded, 'session_completed');

    await this.checkDailyStreakMilestone();
    await this.refreshState();
  }

  /**
   * Spec: Award +5 Gems per blocked app interception directly via Supabase RPC
   */
  async recordInterception(appName: string = 'Instagram'): Promise<void> {
    await syncService.recordInterception(appName);
    api.recordInterception(appName).catch(() => {});
    await this.refreshState();
  }

  /**
   * Awards gems and checks tier rank promotion ladder
   */
  async awardGems(amount: number, reason: string): Promise<void> {
    const profile = await syncService.getProfile();
    const newTotal = (profile.total_gems || 0) + amount;

    // Tier ladder: Bronze -> Silver (500) -> Gold (1500) -> Diamond (3000)
    let newTier = 'Bronze';
    if (newTotal >= 3000) newTier = 'Diamond';
    else if (newTotal >= 1500) newTier = 'Gold';
    else if (newTotal >= 500) newTier = 'Silver';

    await syncService.updateProfile({
      total_gems: newTotal,
      tier_rank: newTier,
    });
  }

  /**
   * Spec: +50 Gems daily when focus_score >= 70 (incrementing streak_days)
   */
  async checkDailyStreakMilestone(): Promise<void> {
    const profile = await syncService.getProfile();
    if (this.state.focusScore >= 70) {
      const updatedStreak = (profile.streak_days || 0) + 1;
      await syncService.updateProfile({
        streak_days: updatedStreak,
        total_gems: (profile.total_gems || 0) + 50,
      });
    }
  }

  // ==========================================
  // SUBSCRIBERS
  // ==========================================
  getState(): FocusEngineState {
    return this.state;
  }

  subscribe(listener: (state: FocusEngineState) => void) {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.state = { ...this.state };
    this.listeners.forEach((l) => l(this.state));
  }
}

export const focusEngine = new FocusEngineService();
export default focusEngine;
