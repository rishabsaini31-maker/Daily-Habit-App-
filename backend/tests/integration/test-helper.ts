import Database, { Database as DatabaseType } from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { createApp } from '../../src/app.js';
import { JwtTokenService } from '../../src/infrastructure/security/jwt-token.service.js';
import { BcryptPasswordHasher } from '../../src/infrastructure/security/bcrypt-hasher.service.js';
import { Express } from 'express';

export async function createTestApp(): Promise<{
  app: Express;
  db: DatabaseType;
  adminToken: string;
  userToken: string;
  adminId: string;
  userId: string;
}> {
  // Use in-memory SQLite database for isolated and fast test execution
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  // Apply migrations
  const migrationsDir = path.resolve(process.cwd(), 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql') && !f.endsWith('_down.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    db.exec(sql);
  }

  const tokenService = new JwtTokenService();
  const passwordHasher = new BcryptPasswordHasher();

  const adminId = 'admin-test-uuid-001';
  const userId = 'user-test-uuid-002';

  const adminHash = await passwordHasher.hash('Admin123!');
  const userHash = await passwordHasher.hash('User123!');

  db.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, role, status, timezone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(adminId, 'admin@test.com', adminHash, 'Admin Tester', 'ADMIN', 'ACTIVE', 'UTC');

  db.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, role, status, timezone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, 'user@test.com', userHash, 'User Tester', 'USER', 'ACTIVE', 'UTC');

  // Seed default category
  db.prepare(`
    INSERT INTO categories (id, name, icon, color, is_system)
    VALUES (?, ?, ?, ?, ?)
  `).run('cat-health', 'Health', 'heart-pulse', '#10B981', 1);

  const adminToken = tokenService.signToken({
    sub: adminId,
    email: 'admin@test.com',
    role: 'ADMIN',
    timezone: 'UTC',
  });

  const userToken = tokenService.signToken({
    sub: userId,
    email: 'user@test.com',
    role: 'USER',
    timezone: 'UTC',
  });

  const app = createApp(db);

  return {
    app,
    db,
    adminToken,
    userToken,
    adminId,
    userId,
  };
}
