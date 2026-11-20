import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './test-helper.js';
import { Express } from 'express';
import { DateString } from '../../src/domain/value-objects/date-string.vo.js';

describe('Completions & Streak Engine API Endpoints', () => {
  let app: Express;
  let userToken: string;
  let habitId: string;
  const today = DateString.today('UTC');

  beforeEach(async () => {
    const testEnv = await createTestApp();
    app = testEnv.app;
    userToken = testEnv.userToken;

    const habitRes = await request(app)
      .post('/api/v1/habits')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Morning Yoga',
        categoryId: 'cat-health',
        frequencyType: 'DAILY',
        targetType: 'BOOLEAN',
      });

    habitId = habitRes.body.data.id;
  });

  it('POST /api/v1/habits/:id/completions logs an idempotent check-in and updates streak', async () => {
    const res = await request(app)
      .post(`/api/v1/habits/${habitId}/completions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        date: today,
        status: 'COMPLETED',
        value: 1,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.completion.date).toBe(today);
    expect(res.body.data.completion.status).toBe('COMPLETED');
    expect(res.body.data.streak.currentStreak).toBe(1);

    // Repeated check-in for the same date must update rather than create duplicate
    const repeatRes = await request(app)
      .post(`/api/v1/habits/${habitId}/completions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        date: today,
        status: 'COMPLETED',
        value: 1,
      });

    expect(repeatRes.status).toBe(200);
    expect(repeatRes.body.data.streak.currentStreak).toBe(1);
  });

  it('DELETE /api/v1/habits/:id/completions/:date deletes a completion and recalculates streak', async () => {
    // Log completion
    await request(app)
      .post(`/api/v1/habits/${habitId}/completions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        date: today,
        status: 'COMPLETED',
      });

    // Delete it
    const res = await request(app)
      .delete(`/api/v1/habits/${habitId}/completions/${today}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dateDeleted).toBe(today);
    expect(res.body.data.updatedStreak.currentStreak).toBe(0);
  });

  it('POST /api/v1/habits/:id/streak/freeze consumes a freeze and preserves streak', async () => {
    // Yesterday completed
    const yesterday = DateString.addDays(today, -1);
    await request(app)
      .post(`/api/v1/habits/${habitId}/completions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        date: yesterday,
        status: 'COMPLETED',
      });

    // Freeze missed day
    const res = await request(app)
      .post(`/api/v1/habits/${habitId}/streak/freeze`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        missedDate: today,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.freezeCountRemaining).toBe(0);
  });

  it('GET /api/v1/analytics/summary returns accurate metrics', async () => {
    await request(app)
      .post(`/api/v1/habits/${habitId}/completions`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        date: today,
        status: 'COMPLETED',
      });

    const res = await request(app)
      .get('/api/v1/analytics/summary')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.activeHabitsCount).toBeGreaterThanOrEqual(1);
    expect(res.body.data.totalCompletions).toBeGreaterThanOrEqual(1);
  });
});
