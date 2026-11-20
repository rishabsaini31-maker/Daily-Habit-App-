import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './test-helper.js';
import { Express } from 'express';

describe('Admin RBAC & Operations API Endpoints', () => {
  let app: Express;
  let adminToken: string;
  let userToken: string;
  let userId: string;

  beforeEach(async () => {
    const testEnv = await createTestApp();
    app = testEnv.app;
    adminToken = testEnv.adminToken;
    userToken = testEnv.userToken;
    userId = testEnv.userId;
  });

  it('blocks non-admin users from accessing /api/v1/admin/dashboard with 403', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTH_FORBIDDEN');
  });

  it('allows admin users to view /api/v1/admin/dashboard', async () => {
    const res = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalUsers).toBeDefined();
    expect(res.body.data.platformCompletionRate).toBeDefined();
  });

  it('PATCH /api/v1/admin/users/:id/status suspends user and logs to audit_logs', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${userId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        status: 'SUSPENDED',
        reason: 'Violated community usage policy.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('SUSPENDED');

    // Verify suspended user is now blocked from logging in
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@test.com',
        password: 'User123!',
      });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.error.code).toBe('AUTH_ACCOUNT_SUSPENDED');

    // Verify audit log entry exists
    const auditRes = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.data.length).toBeGreaterThanOrEqual(1);
    expect(auditRes.body.data[0].action).toBe('USER_SUSPEND');
  });

  it('admin can perform full CRUD on habit templates', async () => {
    // 1. Create Template
    const createRes = await request(app)
      .post('/api/v1/admin/templates')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Deep Focus Morning',
        description: 'Spend 60 minutes in deep work.',
        categoryId: 'cat-health',
        frequencyType: 'DAILY',
        targetType: 'NUMERIC',
        targetValue: 60,
        unit: 'minutes',
        icon: 'focus',
        color: '#3B82F6',
        isPublished: true,
      });

    expect(createRes.status).toBe(201);
    const templateId = createRes.body.data.id;

    // 2. Update Template
    const updateRes = await request(app)
      .put(`/api/v1/admin/templates/${templateId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Deep Focus 90 Mins',
        description: 'Spend 90 minutes in deep work.',
        categoryId: 'cat-health',
        frequencyType: 'DAILY',
        targetType: 'NUMERIC',
        targetValue: 90,
        unit: 'minutes',
        icon: 'focus',
        color: '#3B82F6',
        isPublished: true,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe('Deep Focus 90 Mins');

    // 3. Delete Template
    const deleteRes = await request(app)
      .delete(`/api/v1/admin/templates/${templateId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.success).toBe(true);
  });
});
