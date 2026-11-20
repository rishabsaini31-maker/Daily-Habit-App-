import { DatabaseConnection } from './connection.js';
import { MigrationRunner } from './migration-runner.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function seedDatabase(dbPath?: string): Promise<void> {
  await MigrationRunner.runUp(dbPath);
  const db = DatabaseConnection.getInstance(dbPath);

  // 1. Seed Categories
  const categories = [
    { id: 'cat-health', name: 'Health', icon: 'heart-pulse', color: '#10B981' },
    { id: 'cat-fitness', name: 'Fitness', icon: 'dumbbell', color: '#EF4444' },
    { id: 'cat-productivity', name: 'Productivity', icon: 'briefcase', color: '#3B82F6' },
    { id: 'cat-mindfulness', name: 'Mindfulness', icon: 'smile', color: '#8B5CF6' },
    { id: 'cat-learning', name: 'Learning', icon: 'book-open', color: '#F59E0B' },
    { id: 'cat-finance', name: 'Finance', icon: 'wallet', color: '#14B8A6' },
    { id: 'cat-lifestyle', name: 'Lifestyle', icon: 'sun', color: '#EC4899' },
  ];

  const insertCategory = db.prepare(`
    INSERT OR IGNORE INTO categories (id, name, icon, color, is_system)
    VALUES (?, ?, ?, ?, 1)
  `);

  for (const cat of categories) {
    insertCategory.run(cat.id, cat.name, cat.icon, cat.color);
  }

  // 2. Seed Users (Admin & Demo User)
  const adminPasswordHash = bcrypt.hashSync('Admin123!', 10);
  const userPasswordHash = bcrypt.hashSync('User123!', 10);

  const adminId = 'admin-user-00000000-0000-0000-000000000001';
  const demoUserId = 'demo-user-00000000-0000-0000-000000000002';

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, email, password_hash, display_name, role, status, timezone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    adminId,
    'admin@habitpulse.com',
    adminPasswordHash,
    'Platform Administrator',
    'ADMIN',
    'ACTIVE',
    'UTC'
  );

  insertUser.run(
    demoUserId,
    'user@habitpulse.com',
    userPasswordHash,
    'Alex Tracker',
    'USER',
    'ACTIVE',
    'America/New_York'
  );

  // 3. Seed Habit Templates
  const templates = [
    {
      id: 'tpl-morning-miracle',
      title: 'Morning Miracle',
      description: 'Start your morning with 10 minutes of mindfulness and journaling.',
      categoryId: 'cat-mindfulness',
      frequencyType: 'DAILY',
      frequencyPayload: null,
      targetType: 'BOOLEAN',
      targetValue: null,
      unit: null,
      icon: 'sunrise',
      color: '#8B5CF6',
      isPublished: 1,
      createdBy: adminId,
    },
    {
      id: 'tpl-couch-to-5k',
      title: 'Couch to 5K Workout',
      description: 'Run or jog 3 days a week to build cardiovascular endurance.',
      categoryId: 'cat-fitness',
      frequencyType: 'WEEKLY_DAYS',
      frequencyPayload: JSON.stringify([1, 3, 5]), // Mon, Wed, Fri
      targetType: 'NUMERIC',
      targetValue: 5,
      unit: 'km',
      icon: 'activity',
      color: '#EF4444',
      isPublished: 1,
      createdBy: adminId,
    },
    {
      id: 'tpl-deep-work',
      title: 'Deep Work Sprint',
      description: 'Dedicate 90 uninterrupted minutes to high-value priority work.',
      categoryId: 'cat-productivity',
      frequencyType: 'DAILY',
      frequencyPayload: null,
      targetType: 'NUMERIC',
      targetValue: 90,
      unit: 'minutes',
      icon: 'clock',
      color: '#3B82F6',
      isPublished: 1,
      createdBy: adminId,
    },
    {
      id: 'tpl-daily-hydration',
      title: 'Daily Hydration',
      description: 'Drink at least 2500 ml of pure water throughout the day.',
      categoryId: 'cat-health',
      frequencyType: 'DAILY',
      frequencyPayload: null,
      targetType: 'NUMERIC',
      targetValue: 2500,
      unit: 'ml',
      icon: 'droplet',
      color: '#10B981',
      isPublished: 1,
      createdBy: adminId,
    },
  ];

  const insertTemplate = db.prepare(`
    INSERT OR IGNORE INTO habit_templates (
      id, title, description, category_id, frequency_type, frequency_payload,
      target_type, target_value, unit, icon, color, is_published, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const t of templates) {
    insertTemplate.run(
      t.id,
      t.title,
      t.description,
      t.categoryId,
      t.frequencyType,
      t.frequencyPayload,
      t.targetType,
      t.targetValue,
      t.unit,
      t.icon,
      t.color,
      t.isPublished,
      t.createdBy
    );
  }

  // 4. Seed a Sample Habit for Demo User
  const demoHabitId = 'demo-habit-water-000000000001';
  const insertHabit = db.prepare(`
    INSERT OR IGNORE INTO habits (
      id, user_id, category_id, title, description, frequency_type, target_type,
      target_value, unit, color, icon, is_archived
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `);

  insertHabit.run(
    demoHabitId,
    demoUserId,
    'cat-health',
    'Daily Hydration',
    'Drink 2500ml water daily',
    'DAILY',
    'NUMERIC',
    2500,
    'ml',
    '#10B981',
    'droplet'
  );

  const insertStreak = db.prepare(`
    INSERT OR IGNORE INTO streak_records (
      id, habit_id, current_streak, longest_streak, freeze_count_remaining
    ) VALUES (?, ?, 0, 0, 1)
  `);
  insertStreak.run(uuidv4(), demoHabitId);

  console.log('Database seeded successfully.');
}

if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
