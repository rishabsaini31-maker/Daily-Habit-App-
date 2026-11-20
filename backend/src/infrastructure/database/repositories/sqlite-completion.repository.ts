import { Database as DatabaseType } from 'better-sqlite3';
import { ICompletionRepository, CompletionFilterOptions } from '../../../usecases/ports/completion.repository.port.js';
import { HabitCompletion, CompletionStatus } from '../../../domain/entities/completion.entity.js';

export class SqliteCompletionRepository implements ICompletionRepository {
  constructor(private readonly db: DatabaseType) {}

  private mapRowToEntity(row: any): HabitCompletion {
    return new HabitCompletion({
      id: row.id,
      habitId: row.habit_id,
      userId: row.user_id,
      date: row.date,
      status: row.status as CompletionStatus,
      value: row.value !== null ? Number(row.value) : 1,
      notes: row.notes,
      completedAt: new Date(row.completed_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  public async findById(id: string): Promise<HabitCompletion | null> {
    const row = this.db.prepare('SELECT * FROM habit_completions WHERE id = ?').get(id);
    return row ? this.mapRowToEntity(row) : null;
  }

  public async findByHabitAndDate(habitId: string, date: string): Promise<HabitCompletion | null> {
    const row = this.db
      .prepare('SELECT * FROM habit_completions WHERE habit_id = ? AND date = ?')
      .get(habitId, date);
    return row ? this.mapRowToEntity(row) : null;
  }

  public async findByHabitId(
    habitId: string,
    options?: CompletionFilterOptions
  ): Promise<HabitCompletion[]> {
    let sql = 'SELECT * FROM habit_completions WHERE habit_id = ?';
    const params: any[] = [habitId];

    if (options?.startDate) {
      sql += ' AND date >= ?';
      params.push(options.startDate);
    }
    if (options?.endDate) {
      sql += ' AND date <= ?';
      params.push(options.endDate);
    }

    sql += ' ORDER BY date DESC';

    const rows = this.db.prepare(sql).all(...params);
    return rows.map((r) => this.mapRowToEntity(r));
  }

  public async findByUserIdAndDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<HabitCompletion[]> {
    const sql = `
      SELECT * FROM habit_completions
      WHERE user_id = ? AND date >= ? AND date <= ?
      ORDER BY date ASC
    `;
    const rows = this.db.prepare(sql).all(userId, startDate, endDate);
    return rows.map((r) => this.mapRowToEntity(r));
  }

  public async save(completion: HabitCompletion): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO habit_completions (
        id, habit_id, user_id, date, status, value, notes, completed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(habit_id, date) DO UPDATE SET
        status = excluded.status,
        value = excluded.value,
        notes = excluded.notes,
        completed_at = excluded.completed_at,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      completion.id,
      completion.habitId,
      completion.userId,
      completion.date,
      completion.status,
      completion.value,
      completion.notes,
      completion.completedAt.toISOString(),
      completion.createdAt.toISOString(),
      completion.updatedAt.toISOString()
    );
  }

  public async delete(habitId: string, date: string): Promise<boolean> {
    const result = this.db
      .prepare('DELETE FROM habit_completions WHERE habit_id = ? AND date = ?')
      .run(habitId, date);
    return result.changes > 0;
  }

  public async countCompletionsToday(dateString: string): Promise<number> {
    const row = this.db
      .prepare("SELECT COUNT(*) as count FROM habit_completions WHERE date = ? AND status = 'COMPLETED'")
      .get(dateString) as { count: number };
    return row ? row.count : 0;
  }

  public async countTotalCompletions(userId?: string): Promise<number> {
    let sql = "SELECT COUNT(*) as count FROM habit_completions WHERE status = 'COMPLETED'";
    const params: any[] = [];
    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }
    const row = this.db.prepare(sql).get(...params) as { count: number };
    return row ? row.count : 0;
  }
}
