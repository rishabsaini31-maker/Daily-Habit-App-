import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './test-helper.js';
import { Express } from 'express';

describe('Habits CRUD API Endpoints', () => {
  let app: Express;
  let userToken: string;

  beforeEach(async () => {
    const testEnv = await createTestApp();
    app = testEnv.app;
    userToken = testEnv.userToken;
  });

  it('POST /api/v1/habits creates a new habit with initialized streak', async () => {
    const res = await request(app)
      .post('/api/v1/habits')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Morning Meditation',
        description: '15 mins mindfulness',
        categoryId: 'cat-health',
        frequencyType: 'DAILY',
        targetType: 'BOOLEAN',
        color: '#8B5CF6',
        icon: 'smile',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.title).toBe('Morning Meditation');
    expect(res.body.data.streak).toBeDefined();
    expect(res.body.data.streak.currentStreak).toBe(0);
  });

  it('GET /api/v1/habits lists user habits', async () => {
    // Create habit first
    await request(app)
      .post('/api/v1/habits')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Drink Water',
        categoryId: 'cat-health',
        frequencyType: 'DAILY',
        targetType: 'NUMERIC',
        targetValue: 2000,
        unit: 'ml',
      });

    const res = await request(app)
      .get('/api/v1/habits')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].streak).toBeDefined();
  });

  it('PUT /api/v1/habits/:id updates habit details', async () => {
    const created = await request(app)
      .post('/api/v1/habits')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Read Books',
        categoryId: 'cat-health',
        frequencyType: 'DAILY',
        targetType: 'BOOLEAN',
      });

    const habitId = created.body.data.id;

    const res = await request(app)
      .put(`/api/v1/habits/${habitId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Read 30 Pages',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Read 30 Pages');
  });

  it('PATCH /api/v1/habits/:id/archive toggles archive status', async () => {
    const created = await request(app)
      .post('/api/v1/habits')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Temporary Habit',
        categoryId: 'cat-health',
        frequencyType: 'DAILY',
        targetType: 'BOOLEAN',
      });

    const habitId = created.body.data.id;

    const res = await request(app)
      .patch(`/api/v1/habits/${habitId}/archive`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ isArchived: true });

    expect(res.status).toBe(200);
    expect(res.body.data.isArchived).toBe(true);
  });

  it('DELETE /api/v1/habits/:id deletes a habit', async () => {
    const created = await request(app)
      .post('/api/v1/habits')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'To Be Deleted',
        categoryId: 'cat-health',
        frequencyType: 'DAILY',
        targetType: 'BOOLEAN',
      });

    const habitId = created.body.data.id;

    const res = await request(app)
      .delete(`/api/v1/habits/${habitId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify it cannot be found
    const getRes = await request(app)
      .get(`/api/v1/habits/${habitId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(getRes.status).toBe(404);
  });
});
