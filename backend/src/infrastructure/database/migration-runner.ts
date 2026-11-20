import fs from 'node:fs';
import path from 'node:path';
import { DatabaseConnection } from './connection.js';

export class MigrationRunner {
  public static async runUp(dbPath?: string): Promise<void> {
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
