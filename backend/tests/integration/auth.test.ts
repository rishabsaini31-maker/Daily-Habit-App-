import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './test-helper.js';
import { Express } from 'express';

describe('Auth API Endpoints', () => {
  let app: Express;
  let userToken: string;

  beforeEach(async () => {
    const testEnv = await createTestApp();
    app = testEnv.app;
    userToken = testEnv.userToken;
  });

  it('POST /api/v1/auth/register registers a new user successfully', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'newuser@example.com',
        password: 'Password123!',
        displayName: 'New User',
        timezone: 'America/New_York',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('newuser@example.com');
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.expiresIn).toBe(3600);
  });

  it('POST /api/v1/auth/register rejects duplicate emails with 409', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'user@test.com',
        password: 'Password123!',
        displayName: 'Duplicate User',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('IDEMPOTENCY_CONFLICT');
  });

  it('POST /api/v1/auth/login logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@test.com',
        password: 'User123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('user@test.com');
  });

  it('POST /api/v1/auth/login rejects incorrect passwords with 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'user@test.com',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('AUTH_UNAUTHORIZED');
  });

  it('GET /api/v1/auth/me returns profile for authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('user@test.com');
  });
});
