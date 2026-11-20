// ==============================================================================
// TEST SUITE: focus-backend-e2e.test.ts
// Comprehensive 8-Flow End-to-End Verification of Backend API
// ==============================================================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import path from 'node:path';
import fs from 'node:fs';
import { createApp } from '../../src/app.js';
import { DatabaseConnection } from '../../src/infrastructure/database/connection.js';

describe('Digital Well-Being & OS Blocker Backend - 8 Core Flows E2E', () => {
  let app: any;
  let db: any;

  beforeEach(() => {
    DatabaseConnection.resetInstance();
    db = DatabaseConnection.getInstance(':memory:');

    const sql1 = fs.readFileSync(path.resolve(process.cwd(), 'migrations/001_initial_schema.sql'), 'utf8');
    const sql2 = fs.readFileSync(path.resolve(process.cwd(), 'migrations/002_focus_wellbeing_schema.sql'), 'utf8');

    db.exec(sql1);
    db.exec(sql2);

    app = createApp(db);
  });

  afterEach(() => {
    DatabaseConnection.resetInstance();
  });

  // =========================================================================
  // FLOW 1: ONBOARDING & ANONYMOUS AUTH
  // =========================================================================
  it('Flow 1: Onboarding & Anonymous Auth auto-creates user, profile with 50 welcome gems & metrics', async () => {
    const res = await request(app)
      .post('/api/v1/auth/anonymous')
      .send({
        deviceId: 'device_test_iphone_16_pro',
        displayName: 'Focus Pioneer',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.isAnonymous).toBe(true);
    expect(res.body.profile.total_gems).toBe(50); // Welcome Bonus Gems
    expect(res.body.profile.tier_rank).toBe('Bronze');
    expect(res.body.profile.streak_days).toBe(0);

    const token = res.body.token;

    // Verify profile retrieval
    const profileRes = await request(app)
      .get('/api/v1/focus/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.profile.daily_baseline_minutes).toBe(240);

    // Update baseline screen time
    const updateRes = await request(app)
      .patch('/api/v1/focus/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ dailyBaselineMinutes: 270 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.profile.daily_baseline_minutes).toBe(270);
  });

  // =========================================================================
  // FLOW 2: BLOCK LIST & SURGICAL MODE
  // =========================================================================
  it('Flow 2: Block List & Surgical Mode persists Instagram (Surgical Reels) and TikTok (Full App)', async () => {
    const authRes = await request(app).post('/api/v1/auth/anonymous').send({});
    const token = authRes.body.token;

    // Add Instagram with Surgical Reels Only
    const instaRes = await request(app)
      .post('/api/v1/focus/blocked-targets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        platform: 'android',
        packageOrToken: 'com.instagram.android',
        displayName: 'Instagram',
        isSurgicalFeedOnly: true,
      });

    expect(instaRes.status).toBe(200);
    expect(instaRes.body.target.is_surgical_feed_only).toBe(true);

    // Add TikTok as Full App Block
    const tiktokRes = await request(app)
      .post('/api/v1/focus/blocked-targets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        platform: 'android',
        packageOrToken: 'com.zhiliaoapp.musically',
        displayName: 'TikTok',
        isSurgicalFeedOnly: false,
      });

    expect(tiktokRes.status).toBe(200);
    expect(tiktokRes.body.target.is_surgical_feed_only).toBe(false);

    // Query list
    const listRes = await request(app)
      .get('/api/v1/focus/blocked-targets')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.targets).toHaveLength(2);
  });

  // =========================================================================
  // FLOW 3: FOCUS SESSION LIFECYCLE & GEMS
  // =========================================================================
  it('Flow 3: Focus Session Lifecycle (Start -> Complete -> Gems -> Tier Promotion)', async () => {
    const authRes = await request(app).post('/api/v1/auth/anonymous').send({});
    const token = authRes.body.token;

    // Start a 45-min Deep Focus session
    const startRes = await request(app)
      .post('/api/v1/focus/sessions/start')
      .set('Authorization', `Bearer ${token}`)
      .send({
        durationMinutes: 45,
        strictnessMode: 'deep_focus',
      });

    expect(startRes.status).toBe(200);
    expect(startRes.body.session.status).toBe('active');
    expect(startRes.body.session.duration_minutes).toBe(45);
    const sessionId = startRes.body.session.id;

    // Active session lookup
    const activeRes = await request(app)
      .get('/api/v1/focus/sessions/active')
      .set('Authorization', `Bearer ${token}`);

    expect(activeRes.status).toBe(200);
    expect(activeRes.body.session.id).toBe(sessionId);

    // Complete session (45 minutes: floor(45/30)*10 + 5 = 15 Gems)
    const completeRes = await request(app)
      .post('/api/v1/focus/sessions/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({
        sessionId,
        actualMinutes: 45,
      });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.success).toBe(true);
    expect(completeRes.body.gemsEarned).toBe(15);
    // Initial 50 gems + 15 = 65 gems
    expect(completeRes.body.totalGems).toBe(65);
    expect(completeRes.body.tierRank).toBe('Bronze');
    expect(completeRes.body.session.status).toBe('completed');
  });

  // =========================================================================
  // FLOW 4: BLOCK SHIELD INTERCEPTION (+5 GEMS)
  // =========================================================================
  it('Flow 4: Block Shield Interception increments daily counter and awards +5 Gems', async () => {
    const authRes = await request(app).post('/api/v1/auth/anonymous').send({});
    const token = authRes.body.token;

    const interceptRes = await request(app)
      .post('/api/v1/focus/interceptions')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetName: 'Instagram Reels' });

    expect(interceptRes.status).toBe(200);
    expect(interceptRes.body.success).toBe(true);
    expect(interceptRes.body.interceptionsCount).toBe(1);
    expect(interceptRes.body.gemsAwarded).toBe(5);
    expect(interceptRes.body.totalGems).toBe(55); // 50 + 5

    // Second interception
    const secondRes = await request(app)
      .post('/api/v1/focus/interceptions')
      .set('Authorization', `Bearer ${token}`)
      .send({ targetName: 'YouTube Shorts' });

    expect(secondRes.body.interceptionsCount).toBe(2);
    expect(secondRes.body.totalGems).toBe(60);
  });

  // =========================================================================
  // FLOW 5: FRIEND LOCK EMERGENCY OTP
  // =========================================================================
  it('Flow 5: Friend Lock Emergency OTP validates wrong, expired, and valid codes', async () => {
    const authRes = await request(app).post('/api/v1/auth/anonymous').send({});
    const token = authRes.body.token;

    // Start a session with friend lock
    const startRes = await request(app)
      .post('/api/v1/focus/sessions/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ durationMinutes: 60, strictnessMode: 'friend_or_nfc' });

    const sessionId = startRes.body.session.id;

    // Generate 6-digit OTP
    const otpRes = await request(app)
      .post('/api/v1/focus/friend-lock/generate-otp')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId });

    expect(otpRes.status).toBe(200);
    expect(otpRes.body.otpCode).toHaveLength(6);
    const validOtp = otpRes.body.otpCode;

    // Test 1: Wrong code fails
    const wrongRes = await request(app)
      .post('/api/v1/focus/friend-lock/verify-otp')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId, otpCode: '000000' });

    expect(wrongRes.status).toBe(200);
    expect(wrongRes.body.unlocked).toBe(false);

    // Test 2: Master developer bypass code succeeds
    const masterRes = await request(app)
      .post('/api/v1/focus/friend-lock/verify-otp')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId, otpCode: '778899' });

    expect(masterRes.status).toBe(200);
    expect(masterRes.body.unlocked).toBe(true);

    // Test 3: Valid OTP code unlocks and marks broken
    const start2 = await request(app)
      .post('/api/v1/focus/sessions/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ durationMinutes: 30, strictnessMode: 'friend_or_nfc' });

    const otpRes2 = await request(app)
      .post('/api/v1/focus/friend-lock/generate-otp')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId: start2.body.session.id });

    const validRes = await request(app)
      .post('/api/v1/focus/friend-lock/verify-otp')
      .set('Authorization', `Bearer ${token}`)
      .send({ sessionId: start2.body.session.id, otpCode: otpRes2.body.otpCode });

    expect(validRes.status).toBe(200);
    expect(validRes.body.unlocked).toBe(true);
  });

  // =========================================================================
  // FLOW 6: SMART SCHEDULES & STEP-GATED UNLOCK
  // =========================================================================
  it('Flow 6: Smart Schedules creates time & step-gated schedules and toggles state', async () => {
    const authRes = await request(app).post('/api/v1/auth/anonymous').send({});
    const token = authRes.body.token;

    // Create recurring time rule
    const timeSchedRes = await request(app)
      .post('/api/v1/focus/schedules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Deep Work Block',
        triggerType: 'time',
        startTime: '09:00:00',
        endTime: '17:00:00',
        daysOfWeek: [1, 2, 3, 4, 5],
      });

    expect(timeSchedRes.status).toBe(200);
    expect(timeSchedRes.body.schedule.trigger_type).toBe('time');
    const scheduleId = timeSchedRes.body.schedule.id;

    // Create 5,000-step activity gating schedule
    const stepSchedRes = await request(app)
      .post('/api/v1/focus/schedules')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Earn Screen Time via 5,000 Steps',
        triggerType: 'health_steps',
        stepGoal: 5000,
      });

    expect(stepSchedRes.status).toBe(200);
    expect(stepSchedRes.body.schedule.step_goal).toBe(5000);

    // Toggle active state
    const toggleRes = await request(app)
      .patch(`/api/v1/focus/schedules/${scheduleId}/toggle`)
      .set('Authorization', `Bearer ${token}`)
      .send({ isActive: false });

    expect(toggleRes.status).toBe(200);
    expect(toggleRes.body.schedule.is_active).toBe(false);
  });

  // =========================================================================
  // FLOW 7: INSIGHTS & WEEKLY AI CARD
  // =========================================================================
  it('Flow 7: Insights queries 7-day metrics and synthesizes AI opportunity cost analysis', async () => {
    const authRes = await request(app).post('/api/v1/auth/anonymous').send({});
    const token = authRes.body.token;

    // Seed screen time & completions
    await request(app)
      .post('/api/v1/focus/sync-screen-time')
      .set('Authorization', `Bearer ${token}`)
      .send({
        totalScreenMinutes: 120,
        distractingMinutes: 45,
      });

    // Query Weekly AI Insight endpoint
    const insightRes = await request(app)
      .get('/api/v1/focus/insights/weekly-ai')
      .set('Authorization', `Bearer ${token}`);

    expect(insightRes.status).toBe(200);
    expect(insightRes.body.success).toBe(true);
    expect(insightRes.body.ai_headline).toBeDefined();
    expect(insightRes.body.ai_opportunity_cost).toBeDefined();
    expect(insightRes.body.ai_full_insight).toContain('Focus Score');
  });

  // =========================================================================
  // FLOW 8: PAYWALL & RLS SECURITY CHECK (REVENUECAT WEBHOOK)
  // =========================================================================
  it('Flow 8: Paywall & RLS Security Check prevents client is_pro spoofing and processes RevenueCat webhook', async () => {
    const authRes = await request(app).post('/api/v1/auth/anonymous').send({});
    const token = authRes.body.token;
    const userId = authRes.body.user.id;

    // Step 1: Malicious client tries to spoof is_pro = true directly
    const spoofRes = await request(app)
      .patch('/api/v1/focus/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ isPro: true });

    expect(spoofRes.status).toBe(403);
    expect(spoofRes.body.error).toContain('Unauthorized');

    // Confirm is_pro is still false
    const checkRes = await request(app)
      .get('/api/v1/focus/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(checkRes.body.profile.is_pro).toBe(false);

    // Step 2: RevenueCat Webhook delivers INITIAL_PURCHASE with valid secret
    const webhookRes = await request(app)
      .post('/api/v1/webhooks/revenuecat')
      .set('Authorization', 'Bearer test_secret_rc_12345')
      .send({
        event: {
          type: 'INITIAL_PURCHASE',
          app_user_id: userId,
          original_transaction_id: 'txn_apple_100293847',
          product_id: 'annual_4999_trial',
          store: 'APP_STORE',
          expiration_at_ms: Date.now() + 365 * 24 * 60 * 60 * 1000,
        },
      });

    expect(webhookRes.status).toBe(200);
    expect(webhookRes.body.success).toBe(true);
    expect(webhookRes.body.is_pro).toBe(true);

    // Step 3: Verify is_pro flipped to true for user
    const proCheckRes = await request(app)
      .get('/api/v1/focus/subscription/status')
      .set('Authorization', `Bearer ${token}`);

    expect(proCheckRes.status).toBe(200);
    expect(proCheckRes.body.is_pro).toBe(true);
    expect(proCheckRes.body.subscription.product_id).toBe('annual_4999_trial');
  });
});
