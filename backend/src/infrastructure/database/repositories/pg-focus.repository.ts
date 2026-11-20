// ==============================================================================
// REPOSITORY: PgFocusRepository
// PostgreSQL & Supabase Implementation of Digital Well-Being & Blocker Data Access
// ==============================================================================

import { v4 as uuidv4 } from 'uuid';
import { PgConnection } from '../pg-connection.js';
import { FocusScoringService } from '../../../domain/services/focus-scoring.service.js';
import {
  ProfileRecord,
  BlockedTargetRecord,
  FocusSessionRecord,
  ScheduleRecord,
  DailyMetricRecord,
  SubscriptionRecord,
} from './sqlite-focus.repository.js';

export class PgFocusRepository {
  // ==========================================
  // 1. PROFILES
  // ==========================================
  public async getProfile(userId: string): Promise<ProfileRecord | null> {
    const res = await PgConnection.query(
      'SELECT * FROM profiles WHERE id = $1',
      [userId]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      user_id: row.id,
      display_name: row.display_name || 'Focus Pioneer',
      streak_days: row.streak_days || 0,
      total_gems: row.total_gems || 0,
      tier_rank: row.tier_rank || 'Bronze',
      daily_baseline_minutes: row.daily_baseline_minutes || 240,
      is_pro: Boolean(row.is_pro),
      friend_partner_name: row.friend_partner_name,
      friend_partner_contact: row.friend_partner_contact,
      nfc_tag_uid: row.nfc_tag_uid,
      created_at: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updated_at: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    };
  }

  public async createDefaultProfile(
    userId: string,
    displayName: string = 'Focus Pioneer',
    baselineMinutes: number = 240
  ): Promise<ProfileRecord> {
    const existing = await this.getProfile(userId);
    if (existing) return existing;

    const defaultGems = 50;
    const defaultTier = 'Bronze';

    await PgConnection.query(
      `INSERT INTO profiles (
        id, display_name, streak_days, total_gems, tier_rank, daily_baseline_minutes, is_pro
      ) VALUES ($1, $2, 0, $3, $4, $5, false)
      ON CONFLICT (id) DO NOTHING`,
      [userId, displayName, defaultGems, defaultTier, baselineMinutes]
    );

    await this.getTodayMetrics(userId);
    return (await this.getProfile(userId))!;
  }

  public async updateProfile(
    userId: string,
    updates: Partial<{
      displayName: string;
      baselineMinutes: number;
      isPro: boolean;
      friendPartnerName: string;
      friendPartnerContact: string;
      nfcTagUid: string;
      totalGems: number;
      streakDays: number;
      tierRank: string;
    }>
  ): Promise<ProfileRecord> {
    const profile = (await this.getProfile(userId)) || (await this.createDefaultProfile(userId));

    const newDisplayName = updates.displayName !== undefined ? updates.displayName : profile.display_name;
    const newBaseline = updates.baselineMinutes !== undefined ? updates.baselineMinutes : profile.daily_baseline_minutes;
    const newIsPro = updates.isPro !== undefined ? updates.isPro : profile.is_pro;
    const newFriendName = updates.friendPartnerName !== undefined ? updates.friendPartnerName : profile.friend_partner_name;
    const newFriendContact = updates.friendPartnerContact !== undefined ? updates.friendPartnerContact : profile.friend_partner_contact;
    const newNfcUid = updates.nfcTagUid !== undefined ? updates.nfcTagUid : profile.nfc_tag_uid;
    const newGems = updates.totalGems !== undefined ? updates.totalGems : profile.total_gems;
    const newStreak = updates.streakDays !== undefined ? updates.streakDays : profile.streak_days;
    const newTier = updates.tierRank !== undefined ? updates.tierRank : profile.tier_rank;

    await PgConnection.query(
      `UPDATE profiles
       SET display_name = $1, daily_baseline_minutes = $2, is_pro = $3,
           friend_partner_name = $4, friend_partner_contact = $5, nfc_tag_uid = $6,
           total_gems = $7, streak_days = $8, tier_rank = $9, updated_at = NOW()
       WHERE id = $10`,
      [
        newDisplayName,
        newBaseline,
        newIsPro,
        newFriendName,
        newFriendContact,
        newNfcUid,
        newGems,
        newStreak,
        newTier,
        userId,
      ]
    );

    return (await this.getProfile(userId))!;
  }

  // ==========================================
  // 2. BLOCKED TARGETS
  // ==========================================
  public async getBlockedTargets(userId: string): Promise<BlockedTargetRecord[]> {
    const res = await PgConnection.query(
      `SELECT * FROM blocked_targets WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
    return res.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      platform: row.platform,
      package_or_token: row.package_or_token,
      display_name: row.display_name,
      is_surgical_feed_only: Boolean(row.is_surgical_feed_only),
      created_at: new Date(row.created_at).toISOString(),
    }));
  }

  public async addBlockedTarget(
    userId: string,
    target: {
      platform: 'ios' | 'android';
      packageOrToken: string;
      displayName: string;
      isSurgicalFeedOnly: boolean;
    }
  ): Promise<BlockedTargetRecord> {
    const targetId = uuidv4();
    await PgConnection.query(
      `INSERT INTO blocked_targets (id, user_id, platform, package_or_token, display_name, is_surgical_feed_only)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, platform, package_or_token)
       DO UPDATE SET display_name = EXCLUDED.display_name, is_surgical_feed_only = EXCLUDED.is_surgical_feed_only`,
      [targetId, userId, target.platform, target.packageOrToken, target.displayName, target.isSurgicalFeedOnly]
    );

    const res = await PgConnection.query(
      `SELECT * FROM blocked_targets WHERE user_id = $1 AND platform = $2 AND package_or_token = $3`,
      [userId, target.platform, target.packageOrToken]
    );
    const row = res.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      platform: row.platform,
      package_or_token: row.package_or_token,
      display_name: row.display_name,
      is_surgical_feed_only: Boolean(row.is_surgical_feed_only),
      created_at: new Date(row.created_at).toISOString(),
    };
  }

  public async removeBlockedTarget(userId: string, targetIdOrPackage: string): Promise<boolean> {
    const res = await PgConnection.query(
      `DELETE FROM blocked_targets
       WHERE user_id = $1 AND (id::text = $2 OR package_or_token = $2)`,
      [userId, targetIdOrPackage]
    );
    return (res.rowCount ?? 0) > 0;
  }

  // ==========================================
  // 3. FOCUS SESSIONS
  // ==========================================
  public async createFocusSession(
    userId: string,
    data: {
      id?: string;
      durationMinutes: number;
      strictnessMode?: 'normal' | 'deep_focus' | 'friend_or_nfc';
    }
  ): Promise<FocusSessionRecord> {
    const sessionId = data.id || uuidv4();
    const duration = data.durationMinutes;
    const strictness = data.strictnessMode || 'normal';

    const now = new Date();
    const endTime = new Date(now.getTime() + duration * 60 * 1000);

    // Cancel existing active session
    await PgConnection.query(
      `UPDATE focus_sessions SET status = 'completed', time_saved_minutes = duration_minutes
       WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );

    await PgConnection.query(
      `INSERT INTO focus_sessions (id, user_id, start_time, end_time, duration_minutes, strictness_mode, status, time_saved_minutes)
       VALUES ($1, $2, $3, $4, $5, $6, 'active', 0)`,
      [sessionId, userId, now.toISOString(), endTime.toISOString(), duration, strictness]
    );

    const res = await PgConnection.query(`SELECT * FROM focus_sessions WHERE id = $1`, [sessionId]);
    const row = res.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      start_time: new Date(row.start_time).toISOString(),
      end_time: new Date(row.end_time).toISOString(),
      duration_minutes: row.duration_minutes,
      strictness_mode: row.strictness_mode,
      status: row.status,
      time_saved_minutes: row.time_saved_minutes,
      created_at: new Date(row.created_at).toISOString(),
    };
  }

  public async getActiveSession(userId: string): Promise<FocusSessionRecord | null> {
    const res = await PgConnection.query(
      `SELECT * FROM focus_sessions
       WHERE user_id = $1 AND status = 'active'
       ORDER BY start_time DESC LIMIT 1`,
      [userId]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    const session: FocusSessionRecord = {
      id: row.id,
      user_id: row.user_id,
      start_time: new Date(row.start_time).toISOString(),
      end_time: new Date(row.end_time).toISOString(),
      duration_minutes: row.duration_minutes,
      strictness_mode: row.strictness_mode,
      status: row.status,
      time_saved_minutes: row.time_saved_minutes,
      created_at: new Date(row.created_at).toISOString(),
    };

    if (new Date(session.end_time).getTime() < Date.now()) {
      await this.completeFocusSession(userId, session.id, session.duration_minutes);
      return null;
    }

    return session;
  }

  public async completeFocusSession(
    userId: string,
    sessionId: string,
    actualMinutes: number
  ): Promise<{
    success: boolean;
    session: FocusSessionRecord;
    gemsEarned: number;
    totalGems: number;
    tierRank: string;
    focusScore: number;
  }> {
    const gemsEarned = FocusScoringService.computeGemsEarned(actualMinutes);

    await PgConnection.query(
      `UPDATE focus_sessions
       SET status = 'completed', time_saved_minutes = $1
       WHERE id = $2 AND user_id = $3`,
      [actualMinutes, sessionId, userId]
    );

    const profile = (await this.getProfile(userId)) || (await this.createDefaultProfile(userId));
    const newTotalGems = profile.total_gems + gemsEarned;
    const newTier = FocusScoringService.computeTierRank(newTotalGems);

    await this.updateProfile(userId, {
      totalGems: newTotalGems,
      tierRank: newTier,
    });

    const today = await this.getTodayMetrics(userId);
    const newBlockedTime = today.blocked_time_min + actualMinutes;
    const newGemsToday = today.gems_earned + gemsEarned;

    const completedRes = await PgConnection.query(
      `SELECT COUNT(*) as count FROM focus_sessions
       WHERE user_id = $1 AND status = 'completed' AND DATE(start_time) = CURRENT_DATE`,
      [userId]
    );
    const completedTodayCount = parseInt(completedRes.rows[0]?.count || '1', 10);

    const newFocusScore = FocusScoringService.computeFocusScore(
      today.total_screen_time_min,
      profile.daily_baseline_minutes,
      completedTodayCount
    );

    await PgConnection.query(
      `UPDATE daily_metrics
       SET blocked_time_min = $1, gems_earned = $2, focus_score = $3, updated_at = NOW()
       WHERE id = $4`,
      [newBlockedTime, newGemsToday, newFocusScore, today.id]
    );

    const res = await PgConnection.query(`SELECT * FROM focus_sessions WHERE id = $1`, [sessionId]);
    const row = res.rows[0];

    return {
      success: true,
      session: {
        id: row.id,
        user_id: row.user_id,
        start_time: new Date(row.start_time).toISOString(),
        end_time: new Date(row.end_time).toISOString(),
        duration_minutes: row.duration_minutes,
        strictness_mode: row.strictness_mode,
        status: row.status,
        time_saved_minutes: row.time_saved_minutes,
        created_at: new Date(row.created_at).toISOString(),
      },
      gemsEarned,
      totalGems: newTotalGems,
      tierRank: newTier,
      focusScore: newFocusScore,
    };
  }

  public async cancelFocusSession(userId: string, sessionId: string): Promise<FocusSessionRecord> {
    await PgConnection.query(
      `UPDATE focus_sessions SET status = 'broken' WHERE id = $1 AND user_id = $2`,
      [sessionId, userId]
    );

    const res = await PgConnection.query(`SELECT * FROM focus_sessions WHERE id = $1`, [sessionId]);
    const row = res.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      start_time: new Date(row.start_time).toISOString(),
      end_time: new Date(row.end_time).toISOString(),
      duration_minutes: row.duration_minutes,
      strictness_mode: row.strictness_mode,
      status: row.status,
      time_saved_minutes: row.time_saved_minutes,
      created_at: new Date(row.created_at).toISOString(),
    };
  }

  public async getPastSessions(userId: string, limit: number = 20): Promise<FocusSessionRecord[]> {
    const res = await PgConnection.query(
      `SELECT * FROM focus_sessions
       WHERE user_id = $1 AND status != 'active'
       ORDER BY start_time DESC LIMIT $2`,
      [userId, limit]
    );
    return res.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      start_time: new Date(row.start_time).toISOString(),
      end_time: new Date(row.end_time).toISOString(),
      duration_minutes: row.duration_minutes,
      strictness_mode: row.strictness_mode,
      status: row.status,
      time_saved_minutes: row.time_saved_minutes,
      created_at: new Date(row.created_at).toISOString(),
    }));
  }

  // ==========================================
  // 4. INTERCEPTIONS
  // ==========================================
  public async recordInterception(
    userId: string,
    _targetName: string = 'Blocked App'
  ): Promise<{
    success: boolean;
    interceptionsCount: number;
    gemsAwarded: number;
    totalGems: number;
    tierRank: string;
  }> {
    const gemsAwarded = 5;
    const today = await this.getTodayMetrics(userId);

    await PgConnection.query(
      `UPDATE daily_metrics
       SET interceptions_count = interceptions_count + 1,
           gems_earned = gems_earned + $1,
           updated_at = NOW()
       WHERE id = $2`,
      [gemsAwarded, today.id]
    );

    const profile = (await this.getProfile(userId)) || (await this.createDefaultProfile(userId));
    const newTotalGems = profile.total_gems + gemsAwarded;
    const newTier = FocusScoringService.computeTierRank(newTotalGems);

    await this.updateProfile(userId, {
      totalGems: newTotalGems,
      tierRank: newTier,
    });

    const updatedToday = await this.getTodayMetrics(userId);
    return {
      success: true,
      interceptionsCount: updatedToday.interceptions_count,
      gemsAwarded,
      totalGems: newTotalGems,
      tierRank: newTier,
    };
  }

  // ==========================================
  // 5. FRIEND LOCK OTPs
  // ==========================================
  public async generateFriendUnlockOtp(
    userId: string,
    sessionId?: string
  ): Promise<{
    success: boolean;
    otpCode: string;
    expiresAt: string;
    sessionId?: string;
  }> {
    await PgConnection.query(
      `UPDATE emergency_unlock_codes SET is_used = true WHERE user_id = $1 AND is_used = false`,
      [userId]
    );

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const id = uuidv4();

    await PgConnection.query(
      `INSERT INTO emergency_unlock_codes (id, user_id, session_id, otp_code, expires_at, is_used)
       VALUES ($1, $2, $3, $4, $5, false)`,
      [id, userId, sessionId || null, otpCode, expiresAt]
    );

    return {
      success: true,
      otpCode,
      expiresAt,
      sessionId,
    };
  }

  public async verifyFriendUnlockOtp(
    userId: string,
    otpCode: string,
    sessionId?: string
  ): Promise<{
    unlocked: boolean;
    reason?: string;
    sessionId?: string;
  }> {
    const res = await PgConnection.query(
      `SELECT * FROM emergency_unlock_codes
       WHERE user_id = $1 AND otp_code = $2 AND is_used = false
       ORDER BY created_at DESC LIMIT 1`,
      [userId, otpCode.trim()]
    );

    if (res.rows.length === 0) {
      return { unlocked: false, reason: 'Invalid or expired OTP code' };
    }

    const row = res.rows[0];
    const now = Date.now();
    const expiry = new Date(row.expires_at).getTime();

    if (now > expiry) {
      return { unlocked: false, reason: 'OTP code has expired' };
    }

    await PgConnection.query(
      `UPDATE emergency_unlock_codes SET is_used = true WHERE id = $1`,
      [row.id]
    );

    const targetSessionId = sessionId || row.session_id;
    if (targetSessionId) {
      await this.cancelFocusSession(userId, targetSessionId);
    }

    return {
      unlocked: true,
      sessionId: targetSessionId,
    };
  }

  // ==========================================
  // 6. SCHEDULES
  // ==========================================
  public async getSchedules(userId: string): Promise<ScheduleRecord[]> {
    const res = await PgConnection.query(
      `SELECT * FROM schedules WHERE user_id = $1 ORDER BY created_at ASC`,
      [userId]
    );
    return res.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      trigger_type: row.trigger_type,
      days_of_week: Array.isArray(row.days_of_week) ? row.days_of_week : [1, 2, 3, 4, 5, 6, 7],
      start_time: row.start_time,
      end_time: row.end_time,
      geofence_lat: row.geofence_lat,
      geofence_lng: row.geofence_lng,
      geofence_radius_m: row.geofence_radius_m || 200,
      step_goal: row.step_goal || 5000,
      is_active: Boolean(row.is_active),
      created_at: new Date(row.created_at).toISOString(),
    }));
  }

  public async createSchedule(userId: string, data: Partial<ScheduleRecord>): Promise<ScheduleRecord> {
    const id = data.id || uuidv4();
    const title = data.title || 'Work Focus Block';
    const triggerType = data.trigger_type || 'time';
    const daysOfWeek = data.days_of_week || [1, 2, 3, 4, 5];
    const startTime = data.start_time || '09:00:00';
    const endTime = data.end_time || '17:00:00';
    const geofenceLat = data.geofence_lat || null;
    const geofenceLng = data.geofence_lng || null;
    const geofenceRadiusM = data.geofence_radius_m || 200;
    const stepGoal = data.step_goal || 5000;
    const isActive = data.is_active !== undefined ? data.is_active : true;

    await PgConnection.query(
      `INSERT INTO schedules (
        id, user_id, title, trigger_type, days_of_week, start_time, end_time,
        geofence_lat, geofence_lng, geofence_radius_m, step_goal, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        userId,
        title,
        triggerType,
        daysOfWeek,
        startTime,
        endTime,
        geofenceLat,
        geofenceLng,
        geofenceRadiusM,
        stepGoal,
        isActive,
      ]
    );

    const res = await PgConnection.query(`SELECT * FROM schedules WHERE id = $1`, [id]);
    const row = res.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      trigger_type: row.trigger_type,
      days_of_week: Array.isArray(row.days_of_week) ? row.days_of_week : [1, 2, 3, 4, 5],
      start_time: row.start_time,
      end_time: row.end_time,
      geofence_lat: row.geofence_lat,
      geofence_lng: row.geofence_lng,
      geofence_radius_m: row.geofence_radius_m,
      step_goal: row.step_goal,
      is_active: Boolean(row.is_active),
      created_at: new Date(row.created_at).toISOString(),
    };
  }

  public async toggleSchedule(
    userId: string,
    scheduleId: string,
    isActive: boolean
  ): Promise<ScheduleRecord | null> {
    await PgConnection.query(
      `UPDATE schedules SET is_active = $1 WHERE id = $2 AND user_id = $3`,
      [isActive, scheduleId, userId]
    );

    const res = await PgConnection.query(
      `SELECT * FROM schedules WHERE id = $1 AND user_id = $2`,
      [scheduleId, userId]
    );
    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      trigger_type: row.trigger_type,
      days_of_week: Array.isArray(row.days_of_week) ? row.days_of_week : [1, 2, 3, 4, 5],
      start_time: row.start_time,
      end_time: row.end_time,
      geofence_lat: row.geofence_lat,
      geofence_lng: row.geofence_lng,
      geofence_radius_m: row.geofence_radius_m,
      step_goal: row.step_goal,
      is_active: Boolean(row.is_active),
      created_at: new Date(row.created_at).toISOString(),
    };
  }

  // ==========================================
  // 7. DAILY METRICS & SCREEN TIME SYNC
  // ==========================================
  public async getTodayMetrics(userId: string): Promise<DailyMetricRecord> {
    const today = new Date().toISOString().split('T')[0];
    const res = await PgConnection.query(
      `SELECT * FROM daily_metrics WHERE user_id = $1 AND metric_date = $2`,
      [userId, today]
    );

    if (res.rows.length > 0) {
      const row = res.rows[0];
      return {
        id: row.id,
        user_id: row.user_id,
        metric_date: today,
        focus_score: row.focus_score,
        total_screen_time_min: row.total_screen_time_min,
        blocked_time_min: row.blocked_time_min,
        interceptions_count: row.interceptions_count,
        gems_earned: row.gems_earned,
        created_at: new Date(row.created_at).toISOString(),
        updated_at: new Date(row.updated_at).toISOString(),
      };
    }

    const id = uuidv4();
    await PgConnection.query(
      `INSERT INTO daily_metrics (id, user_id, metric_date, focus_score, total_screen_time_min, blocked_time_min, interceptions_count, gems_earned)
       VALUES ($1, $2, $3, 100, 0, 0, 0, 0)
       ON CONFLICT (user_id, metric_date) DO NOTHING`,
      [id, userId, today]
    );

    return {
      id,
      user_id: userId,
      metric_date: today,
      focus_score: 100,
      total_screen_time_min: 0,
      blocked_time_min: 0,
      interceptions_count: 0,
      gems_earned: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  public async syncDailyScreenTime(
    userId: string,
    totalScreenMin: number,
    distractingMin: number
  ): Promise<{
    metrics: DailyMetricRecord;
    focusScore: number;
    streakDays: number;
    totalGems: number;
    streakAwarded: boolean;
  }> {
    const profile = (await this.getProfile(userId)) || (await this.createDefaultProfile(userId));
    const completedRes = await PgConnection.query(
      `SELECT COUNT(*) as count FROM focus_sessions
       WHERE user_id = $1 AND status = 'completed' AND DATE(start_time) = CURRENT_DATE`,
      [userId]
    );
    const completedTodayCount = parseInt(completedRes.rows[0]?.count || '1', 10);

    const focusScore = FocusScoringService.computeFocusScore(
      distractingMin,
      profile.daily_baseline_minutes,
      completedTodayCount
    );

    const today = await this.getTodayMetrics(userId);
    let streakAwarded = false;
    let newStreak = profile.streak_days;
    let newGems = profile.total_gems;

    if (focusScore >= 70) {
      newStreak += 1;
      newGems += 50;
      streakAwarded = true;
    }

    await this.updateProfile(userId, {
      streakDays: newStreak,
      totalGems: newGems,
      tierRank: FocusScoringService.computeTierRank(newGems),
    });

    await PgConnection.query(
      `UPDATE daily_metrics
       SET total_screen_time_min = $1, focus_score = $2, updated_at = NOW()
       WHERE id = $3`,
      [totalScreenMin, focusScore, today.id]
    );

    const updated = await this.getTodayMetrics(userId);

    return {
      metrics: updated,
      focusScore,
      streakDays: newStreak,
      totalGems: newGems,
      streakAwarded,
    };
  }

  public async getWeeklyMetrics(userId: string): Promise<DailyMetricRecord[]> {
    const res = await PgConnection.query(
      `SELECT * FROM daily_metrics
       WHERE user_id = $1
       ORDER BY metric_date DESC LIMIT 7`,
      [userId]
    );
    return res.rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      metric_date: typeof row.metric_date === 'string' ? row.metric_date : row.metric_date.toISOString().split('T')[0],
      focus_score: row.focus_score,
      total_screen_time_min: row.total_screen_time_min,
      blocked_time_min: row.blocked_time_min,
      interceptions_count: row.interceptions_count,
      gems_earned: row.gems_earned,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    }));
  }

  // ==========================================
  // 8. SUBSCRIPTIONS & REVENUECAT
  // ==========================================
  public async upsertSubscription(
    userId: string,
    sub: {
      originalTransactionId?: string;
      productId: string;
      store?: string;
      status?: string;
      isActive: boolean;
      expiresAt?: string;
    }
  ): Promise<SubscriptionRecord> {
    const id = uuidv4();
    const store = sub.store || 'app_store';
    const status = sub.status || (sub.isActive ? 'active' : 'expired');
    const isActive = sub.isActive;
    const expiresAt = sub.expiresAt || new Date(Date.now() + 365 * 86400000).toISOString();
    const origTxId = sub.originalTransactionId || null;

    await PgConnection.query(
      `INSERT INTO subscriptions (
        id, user_id, original_transaction_id, product_id, store, status, is_active, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET original_transaction_id = EXCLUDED.original_transaction_id,
                    status = EXCLUDED.status,
                    is_active = EXCLUDED.is_active,
                    expires_at = EXCLUDED.expires_at,
                    updated_at = NOW()`,
      [id, userId, origTxId, sub.productId, store, status, isActive, expiresAt]
    );

    await this.updateProfile(userId, { isPro: isActive });

    const res = await PgConnection.query(
      `SELECT * FROM subscriptions WHERE user_id = $1 AND product_id = $2`,
      [userId, sub.productId]
    );
    const row = res.rows[0];

    return {
      id: row.id,
      user_id: row.user_id,
      original_transaction_id: row.original_transaction_id,
      product_id: row.product_id,
      store: row.store,
      status: row.status,
      is_active: Boolean(row.is_active),
      expires_at: row.expires_at ? new Date(row.expires_at).toISOString() : null,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }

  public async getSubscription(userId: string): Promise<SubscriptionRecord | null> {
    const res = await PgConnection.query(
      `SELECT * FROM subscriptions
       WHERE user_id = $1 AND is_active = true
       ORDER BY updated_at DESC LIMIT 1`,
      [userId]
    );

    if (res.rows.length === 0) return null;
    const row = res.rows[0];
    return {
      id: row.id,
      user_id: row.user_id,
      original_transaction_id: row.original_transaction_id,
      product_id: row.product_id,
      store: row.store,
      status: row.status,
      is_active: Boolean(row.is_active),
      expires_at: row.expires_at ? new Date(row.expires_at).toISOString() : null,
      created_at: new Date(row.created_at).toISOString(),
      updated_at: new Date(row.updated_at).toISOString(),
    };
  }
}

export default PgFocusRepository;
