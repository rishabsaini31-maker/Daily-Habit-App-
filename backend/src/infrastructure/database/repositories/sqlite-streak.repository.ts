import { Database as DatabaseType } from 'better-sqlite3';
import { IStreakRepository } from '../../../usecases/ports/streak.repository.port.js';
import { StreakRecord } from '../../../domain/entities/streak.entity.js';

export class SqliteStreakRepository implements IStreakRepository {
  constructor(private readonly db: DatabaseType) {}

  private mapRowToEntity(row: any): StreakRecord {
    return new StreakRecord({
      id: row.id,
      habitId: row.habit_id,
      currentStreak: Number(row.current_streak),
      longestStreak: Number(row.longest_streak),
      lastCompletedDate: row.last_completed_date,
      freezeCountRemaining: Number(row.freeze_count_remaining),
      updatedAt: new Date(row.updated_at),
    });
  }

  public async findByHabitId(habitId: string): Promise<StreakRecord | null> {
    const row = this.db.prepare('SELECT * FROM streak_records WHERE habit_id = ?').get(habitId);
    return row ? this.mapRowToEntity(row) : null;
  }

  public async save(streak: StreakRecord): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO streak_records (
        id, habit_id, current_streak, longest_streak, last_completed_date,
        freeze_count_remaining, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(habit_id) DO UPDATE SET
        current_streak = excluded.current_streak,
        longest_streak = excluded.longest_streak,
        last_completed_date = excluded.last_completed_date,
        freeze_count_remaining = excluded.freeze_count_remaining,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      streak.id,
      streak.habitId,
      streak.currentStreak,
      streak.longestStreak,
      streak.lastCompletedDate,
      streak.freezeCountRemaining,
      streak.updatedAt.toISOString()
    );
  }

  public async update(streak: StreakRecord): Promise<void> {
    await this.save(streak);
  }

  public async findLongestOverall(userId: string): Promise<number> {
    const row = this.db
      .prepare(`
        SELECT COALESCE(MAX(s.longest_streak), 0) as maxStreak
        FROM streak_records s
        JOIN habits h ON s.habit_id = h.id
        WHERE h.user_id = ?
      `)
      .get(userId) as { maxStreak: number };
    return row ? row.maxStreak : 0;
  }

  public async countActiveStreaks(userId?: string): Promise<number> {
    let sql = `
      SELECT COUNT(*) as count
      FROM streak_records s
      JOIN habits h ON s.habit_id = h.id
      WHERE s.current_streak > 0 AND h.is_archived = 0
    `;
    const params: any[] = [];
    if (userId) {
      sql += ' AND h.user_id = ?';
      params.push(userId);
    }
    const row = this.db.prepare(sql).get(...params) as { count: number };
    return row ? row.count : 0;
  }
}
