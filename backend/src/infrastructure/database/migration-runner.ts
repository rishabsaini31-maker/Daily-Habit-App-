import fs from 'node:fs';
import path from 'node:path';
import { DatabaseConnection } from './connection.js';
import { PgConnection } from './pg-connection.js';

export class MigrationRunner {
  public static async runUp(dbPath?: string): Promise<void> {
    const isPostgres =
      process.env.DATABASE_URL?.startsWith('postgres://') ||
      process.env.DATABASE_URL?.startsWith('postgresql://');

    if (isPostgres && process.env.NODE_ENV !== 'test') {
      await MigrationRunner.runUpPg();
      return;
    }

    const db = DatabaseConnection.getInstance(dbPath);

    // Create migrations tracker table
    db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.resolve(process.cwd(), 'migrations');
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found at: ${migrationsDir}`);
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql') && !f.endsWith('_down.sql'))
      .sort();

    const appliedRows = db.prepare('SELECT name FROM _migrations').all() as { name: string }[];
    const appliedNames = new Set(appliedRows.map((r) => r.name));

    for (const file of files) {
      if (!appliedNames.has(file)) {
        console.log(`Applying migration: ${file}...`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        db.transaction(() => {
          db.exec(sql);
          db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(file);
        })();

        console.log(`Migration applied: ${file}`);
      }
    }
  }

  public static async runUpPg(): Promise<void> {
    console.log('Connecting to PostgreSQL for migrations...');
    await PgConnection.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const appliedRows = await PgConnection.query<{ name: string }>(
      'SELECT name FROM _migrations'
    );
    const appliedNames = new Set(appliedRows.rows.map((r) => r.name));

    // 1. Supabase migrations if exists
    const supabaseMigrationsDir = path.resolve(process.cwd(), '../supabase/migrations');
    if (fs.existsSync(supabaseMigrationsDir)) {
      const supabaseFiles = fs
        .readdirSync(supabaseMigrationsDir)
        .filter((f) => f.endsWith('.sql'))
        .sort();

      for (const file of supabaseFiles) {
        if (!appliedNames.has(`supabase_${file}`)) {
          console.log(`Applying Supabase migration to PostgreSQL: ${file}...`);
          const sql = fs.readFileSync(path.join(supabaseMigrationsDir, file), 'utf8');
          await PgConnection.query(sql);
          await PgConnection.query('INSERT INTO _migrations (name) VALUES ($1)', [
            `supabase_${file}`,
          ]);
          console.log(`Applied Supabase migration: ${file}`);
        }
      }
    }

    // 2. Backend migrations
    const migrationsDir = path.resolve(process.cwd(), 'migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.sql') && !f.endsWith('_down.sql'))
        .sort();

      for (const file of files) {
        if (!appliedNames.has(file)) {
          // If this is the SQLite well-being schema, Supabase migrations already handle it on PostgreSQL
          if (file === '002_focus_wellbeing_schema.sql') {
            await PgConnection.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
            console.log(`Skipped SQLite-specific migration on PostgreSQL (handled by Supabase migrations): ${file}`);
            continue;
          }

          console.log(`Applying backend migration to PostgreSQL: ${file}...`);
          let sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          await PgConnection.query(sql);
          await PgConnection.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
          console.log(`Applied backend migration: ${file}`);
        }
      }
    }
  }

  public static async runDown(dbPath?: string): Promise<void> {
    const db = DatabaseConnection.getInstance(dbPath);

    db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.resolve(process.cwd(), 'migrations');
    const appliedRows = db
      .prepare('SELECT name FROM _migrations ORDER BY id DESC')
      .all() as { name: string }[];

    if (appliedRows.length === 0) {
      console.log('No applied migrations to rollback.');
      return;
    }

    for (const row of appliedRows) {
      const downFile = row.name.replace('.sql', '_down.sql');
      const downPath = path.join(migrationsDir, downFile);

      if (fs.existsSync(downPath)) {
        console.log(`Rolling back migration using: ${downFile}...`);
        const sql = fs.readFileSync(downPath, 'utf8');

        db.transaction(() => {
          db.exec(sql);
          db.prepare('DELETE FROM _migrations WHERE name = ?').run(row.name);
        })();

        console.log(`Rollback completed for: ${row.name}`);
      } else {
        console.warn(`Down migration file not found: ${downFile}`);
      }
    }
  }
}
