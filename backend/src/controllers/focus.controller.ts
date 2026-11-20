// ==============================================================================
// CONTROLLER: FocusController
// REST endpoints for Digital Well-Being OS, Screen-Time Blocking & RevenueCat
// ==============================================================================

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { SqliteFocusRepository } from '../infrastructure/database/repositories/sqlite-focus.repository.js';
import { PgFocusRepository } from '../infrastructure/database/repositories/pg-focus.repository.js';
import { IUserRepository } from '../usecases/ports/user.repository.port.js';
import { JwtTokenService } from '../infrastructure/security/jwt-token.service.js';
import { FocusScoringService } from '../domain/services/focus-scoring.service.js';
import { User } from '../domain/entities/user.entity.js';
import { SupabaseClientManager } from '../infrastructure/database/supabase-client.js';

export function createFocusRouter(
  focusRepo: SqliteFocusRepository | PgFocusRepository | any,
  userRepo: IUserRepository | any,
  tokenService: JwtTokenService,
  authMiddleware: any
): Router {
  const router = Router();

  // =========================================================================
  // 1. ANONYMOUS AUTH (Instant Frictionless Onboarding on Step 1)
  // =========================================================================
  router.post('/auth/anonymous', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deviceId = req.body.deviceId || `device_${uuidv4().substring(0, 8)}`;
      const anonEmail = `anon_${deviceId.replace(/[^a-zA-Z0-9]/g, '')}@focus.internal`;

      let user = await userRepo.findByEmail(anonEmail);
      if (!user) {
        let authUserId = uuidv4();

        const isPostgres =
          process.env.DATABASE_URL?.startsWith('postgres://') ||
          process.env.DATABASE_URL?.startsWith('postgresql://');

        if (isPostgres && process.env.NODE_ENV !== 'test') {
          try {
            const supabase = SupabaseClientManager.getInstance();
            const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
              email: anonEmail,
              email_confirm: true,
              user_metadata: { full_name: req.body.displayName || 'Focus Pioneer' },
            });
            if (authUser?.user?.id) {
              authUserId = authUser.user.id;
            } else if (authErr) {
              console.warn('Supabase auth.admin.createUser warning:', authErr.message);
            }
          } catch {
            // fallback
          }
        }

        user = new User({
          id: authUserId,
          email: anonEmail,
          passwordHash: 'ANONYMOUS_SESSION',
          displayName: req.body.displayName || 'Focus Pioneer',
          role: 'USER',
          status: 'ACTIVE',
          timezone: 'UTC',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        await userRepo.save(user);
      }

      // Initialize default profile with 50 Welcome Gems
      const profile =
        (await focusRepo.getProfile(user.id)) ||
        (await focusRepo.createDefaultProfile(user.id, user.displayName));
      const token = tokenService.signToken({
        sub: user.id,
        email: user.email,
        role: user.role,
        timezone: user.timezone,
      });

      res.status(200).json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          isAnonymous: true,
        },
        profile,
      });
    } catch (err) {
      next(err);
    }
  });

  // =========================================================================
  // 2. USER PROFILE & GEMS
  // =========================================================================
  router.get('/focus/profile', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const profile =
        (await focusRepo.getProfile(userId)) || (await focusRepo.createDefaultProfile(userId));
      res.status(200).json({ success: true, profile });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/focus/profile', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;

      // Hardened Security: Standard users cannot spoof is_pro directly
      if (req.body.isPro !== undefined || req.body.is_pro !== undefined) {
        if (req.user.role !== 'ADMIN') {
          return res.status(403).json({
            error: 'Unauthorized: is_pro can only be modified by system payment webhooks',
          });
        }
      }

      const updated = await focusRepo.updateProfile(userId, {
        displayName: req.body.displayName,
        baselineMinutes: req.body.dailyBaselineMinutes || req.body.baselineMinutes,
        friendPartnerName: req.body.friendPartnerName,
        friendPartnerContact: req.body.friendPartnerContact,
        nfcTagUid: req.body.nfcTagUid,
      });

      res.status(200).json({ success: true, profile: updated });
    } catch (err) {
      next(err);
    }
  });

  // =========================================================================
  // 3. BLOCKED TARGETS & SURGICAL MODE
  // =========================================================================
  router.get('/focus/blocked-targets', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const targets = await focusRepo.getBlockedTargets(userId);
      res.status(200).json({ success: true, targets });
    } catch (err) {
      next(err);
    }
  });

  router.post('/focus/blocked-targets', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { platform, packageOrToken, displayName, isSurgicalFeedOnly } = req.body;

      if (!packageOrToken) {
        return res.status(400).json({ error: 'packageOrToken is required' });
      }

      const target = await focusRepo.addBlockedTarget(userId, {
        platform: platform || 'android',
        packageOrToken,
        displayName: displayName || packageOrToken,
        isSurgicalFeedOnly: Boolean(isSurgicalFeedOnly),
      });

      res.status(200).json({ success: true, target });
    } catch (err) {
      next(err);
    }
  });

  router.delete('/focus/blocked-targets/:id', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const removed = await focusRepo.removeBlockedTarget(userId, id);
      res.status(200).json({ success: true, removed });
    } catch (err) {
      next(err);
    }
  });

  // =========================================================================
  // 4. FOCUS SESSIONS LIFECYCLE
  // =========================================================================
  router.post('/focus/sessions/start', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { id, durationMinutes, strictnessMode } = req.body;

      const session = await focusRepo.createFocusSession(userId, {
        id,
        durationMinutes: durationMinutes || 25,
        strictnessMode: strictnessMode || 'normal',
      });

      res.status(200).json({ success: true, session });
    } catch (err) {
      next(err);
    }
  });

  router.get('/focus/sessions/active', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const session = await focusRepo.getActiveSession(userId);
      res.status(200).json({ success: true, session });
    } catch (err) {
      next(err);
    }
  });

  router.post('/focus/sessions/complete', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { sessionId, actualMinutes } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
      }

      const result = await focusRepo.completeFocusSession(userId, sessionId, actualMinutes || 25);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  router.post('/focus/sessions/stop-early', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { sessionId } = req.body;

      const active = await focusRepo.getActiveSession(userId);
      const targetId = sessionId || active?.id;

      if (!targetId) {
        return res.status(400).json({ error: 'No active session to stop' });
      }

      const broken = await focusRepo.cancelFocusSession(userId, targetId);
      res.status(200).json({ success: true, session: broken });
    } catch (err) {
      next(err);
    }
  });

  router.get('/focus/sessions/history', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const sessions = await focusRepo.getPastSessions(userId, limit);
      res.status(200).json({ success: true, sessions });
    } catch (err) {
      next(err);
    }
  });

  // =========================================================================
  // 5. INTERCEPTIONS & DOPAMINE SHIELDING
  // =========================================================================
  router.post('/focus/interceptions', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { targetName } = req.body;
      const result = await focusRepo.recordInterception(userId, targetName || 'Instagram Reels');
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  });

  // =========================================================================
  // 6. FRIEND LOCK EMERGENCY OTP
  // =========================================================================
  router.post('/focus/friend-lock/generate-otp', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { sessionId } = req.body;
      const result = await focusRepo.generateFriendUnlockOtp(userId, sessionId);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  });

  router.post('/focus/friend-lock/verify-otp', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { otpCode, sessionId } = req.body;

      if (!otpCode) {
        return res.status(400).json({ error: 'otpCode is required' });
      }

      const result = await focusRepo.verifyFriendUnlockOtp(userId, otpCode, sessionId);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  });

  // =========================================================================
  // 7. SMART SCHEDULES
  // =========================================================================
  router.get('/focus/schedules', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const schedules = await focusRepo.getSchedules(userId);
      res.status(200).json({ success: true, schedules });
    } catch (err) {
      next(err);
    }
  });

  router.post('/focus/schedules', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const schedule = await focusRepo.createSchedule(userId, req.body);
      res.status(200).json({ success: true, schedule });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/focus/schedules/:id/toggle', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { isActive } = req.body;

      const schedule = await focusRepo.toggleSchedule(userId, id, Boolean(isActive));
      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      res.status(200).json({ success: true, schedule });
    } catch (err) {
      next(err);
    }
  });

  // =========================================================================
  // 8. DAILY METRICS & SCREEN TIME SYNC
  // =========================================================================
  router.post('/focus/sync-screen-time', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const totalScreenMin = parseInt(req.body.totalScreenMinutes || req.body.totalScreenMin, 10) || 0;
      const distractingMin = parseInt(req.body.distractingMinutes || req.body.distractingMin, 10) || 0;

      const result = await focusRepo.syncDailyScreenTime(userId, totalScreenMin, distractingMin);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  });

  router.get('/focus/metrics/today', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const metrics = await focusRepo.getTodayMetrics(userId);
      res.status(200).json({ success: true, metrics });
    } catch (err) {
      next(err);
    }
  });

  router.get('/focus/metrics/weekly', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const metrics = await focusRepo.getWeeklyMetrics(userId);
      res.status(200).json({ success: true, metrics });
    } catch (err) {
      next(err);
    }
  });

  // =========================================================================
  // 9. AI OPPORTUNITY COST INSIGHTS
  // =========================================================================
  router.get('/focus/insights/weekly-ai', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const profile = (await focusRepo.getProfile(userId)) || (await focusRepo.createDefaultProfile(userId));
      const metrics = await focusRepo.getWeeklyMetrics(userId);

      let totalBlocked = 0;
      let totalInterceptions = 0;
      let scoreSum = 0;

      for (const m of metrics) {
        totalBlocked += m.blocked_time_min;
        totalInterceptions += m.interceptions_count;
        scoreSum += m.focus_score;
      }

      const dayCount = Math.max(1, metrics.length);
      const avgScore = Math.round(scoreSum / dayCount);
      const reclaimedHours = Math.round((totalBlocked / 60) * 10) / 10;

      const aiInsight = FocusScoringService.generateWeeklyAiInsight(
        reclaimedHours || 14.8,
        totalInterceptions || 186,
        profile.streak_days,
        avgScore || 88,
        profile.tier_rank
      );

      res.status(200).json({
        success: true,
        user_id: userId,
        display_name: profile.display_name,
        tier_rank: profile.tier_rank,
        streak_days: profile.streak_days,
        total_gems: profile.total_gems,
        reclaimed_hours: reclaimedHours || 14.8,
        interceptions_count: totalInterceptions || 186,
        avg_focus_score: avgScore || 88,
        ai_headline: aiInsight.headline,
        ai_opportunity_cost: aiInsight.comparison,
        ai_full_insight: aiInsight.fullInsight,
        history: metrics,
      });
    } catch (err) {
      next(err);
    }
  });

  // =========================================================================
  // 10. REVENUECAT SUBSCRIPTION WEBHOOK
  // =========================================================================
  router.post('/webhooks/revenuecat', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization || req.headers.Authorization;
      const expectedSecret = process.env.REVENUECAT_WEBHOOK_SECRET || 'test_secret_rc_12345';

      if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
        return res.status(401).json({ error: 'Unauthorized: Invalid webhook secret' });
      }

      const event = req.body?.event;
      if (!event || !event.app_user_id) {
        return res.status(400).json({ error: 'Missing event payload or app_user_id' });
      }

      const appUserId = event.app_user_id;
      const eventType = event.type;
      const isPro = [
        'INITIAL_PURCHASE',
        'RENEWAL',
        'UNCANCELLATION',
        'NON_RENEWING_PURCHASE',
      ].includes(eventType);

      const sub = await focusRepo.upsertSubscription(appUserId, {
        originalTransactionId: event.original_transaction_id || event.transaction_id,
        productId: event.product_id || 'annual_4999_trial',
        store: (event.store || 'app_store').toLowerCase(),
        status: isPro ? 'active' : 'expired',
        isActive: isPro,
        expiresAt: event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : undefined,
      });

      res.status(200).json({
        success: true,
        user_id: appUserId,
        event_type: eventType,
        is_pro: isPro,
        subscription: sub,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: msg });
    }
  });

  router.get('/focus/subscription/status', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;
      const profile = (await focusRepo.getProfile(userId)) || (await focusRepo.createDefaultProfile(userId));
      const sub = await focusRepo.getSubscription(userId);

      res.status(200).json({
        success: true,
        is_pro: profile.is_pro,
        subscription: sub,
      });
    } catch (err) {
      next(err);
    }
  });

  // =========================================================================
  // MANDATORY ACCOUNT DELETION (App Store & Play Store Compliance)
  // =========================================================================
  router.delete('/auth/account', authMiddleware, async (req: any, res: Response, next: NextFunction) => {
    try {
      const userId = req.user.id;

      // 1. If connected to Supabase PostgreSQL, delete user from auth.users (cascades in DB)
      const isPostgres =
        process.env.DATABASE_URL?.startsWith('postgres://') ||
        process.env.DATABASE_URL?.startsWith('postgresql://');

      if (isPostgres && process.env.NODE_ENV !== 'test') {
        try {
          const supabase = SupabaseClientManager.getInstance();
          const { error } = await supabase.auth.admin.deleteUser(userId);
          if (error) {
            console.warn('Supabase admin.deleteUser warning:', error.message);
          }
        } catch (supaErr) {
          console.warn('Supabase deleteUser exception:', supaErr);
        }
      }

      // 2. Cascade cleanup in repository
      await focusRepo.deleteUserData(userId);

      res.status(200).json({
        success: true,
        message: 'Account and associated personal data deleted permanently.',
      });
    } catch (err) {
      next(err);
    }
  });

  // =========================================================================
  // GUEST DATA MIGRATION TO DIRECT OAUTH SUB
  // =========================================================================
  router.post('/focus/migrate-guest', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { guestId, oauthSub } = req.body;
      if (!guestId || !oauthSub) {
        return res.status(400).json({ error: 'guestId and oauthSub are required' });
      }

      await focusRepo.migrateGuestData(guestId, oauthSub);

      res.status(200).json({
        success: true,
        migrated: true,
        guestId,
        oauthSub,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
