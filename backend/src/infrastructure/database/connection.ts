import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

export class DatabaseConnection {
  private static instance: DatabaseType | null = null;

  public static getInstance(dbPath?: string): DatabaseType {
    if (!DatabaseConnection.instance) {
      const isPostgresUrl = process.env.DATABASE_URL?.startsWith('postgres');
      const targetPath =
        dbPath ||
        process.env.SQLITE_DB_PATH ||
        (!isPostgresUrl ? process.env.DATABASE_URL : undefined) ||
        (process.env.NODE_ENV === 'test'
          ? ':memory:'
          : path.resolve(process.cwd(), 'habit_tracker.db'));

      if (targetPath !== ':memory:') {
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }

      DatabaseConnection.instance = new Database(targetPath);
      // Enable WAL mode and foreign keys for durability and relational integrity
      if (targetPath !== ':memory:') {
        DatabaseConnection.instance.pragma('journal_mode = WAL');
      }
      DatabaseConnection.instance.pragma('foreign_keys = ON');
    }

    return DatabaseConnection.instance;
  }

  public static resetInstance(): void {
    if (DatabaseConnection.instance) {
      DatabaseConnection.instance.close();
      DatabaseConnection.instance = null;
    }
  }
}
