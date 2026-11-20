import { Database as DatabaseType } from 'better-sqlite3';
import { IHabitRepository, HabitFilterOptions } from '../../../usecases/ports/habit.repository.port.js';
import { Habit } from '../../../domain/entities/habit.entity.js';
import { FrequencyType } from '../../../domain/value-objects/frequency-type.vo.js';
import { TargetType } from '../../../domain/value-objects/target-type.vo.js';

export class SqliteHabitRepository implements IHabitRepository {
  constructor(private readonly db: DatabaseType) {}

  private mapRowToEntity(row: any): Habit {
    let frequencyPayload: number[] | null = null;
    if (row.frequency_payload) {
      try {
        frequencyPayload = JSON.parse(row.frequency_payload);
      } catch {
        frequencyPayload = null;
      }
    }

    return new Habit({
      id: row.id,
      userId: row.user_id,
      categoryId: row.category_id,
      title: row.title,
      description: row.description,
      frequencyType: row.frequency_type as FrequencyType,
      frequencyPayload,
      targetType: row.target_type as TargetType,
      targetValue: row.target_value !== null ? Number(row.target_value) : null,
      unit: row.unit,
      reminderTime: row.reminder_time,
      color: row.color,
      icon: row.icon,
      isArchived: Boolean(row.is_archived),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  public async findById(id: string): Promise<Habit | null> {
    const row = this.db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
    return row ? this.mapRowToEntity(row) : null;
  }

  public async findByUserId(userId: string, options?: HabitFilterOptions): Promise<Habit[]> {
    let sql = 'SELECT * FROM habits WHERE user_id = ?';
    const params: any[] = [userId];

    if (options?.isArchived !== undefined) {
      sql += ' AND is_archived = ?';
      params.push(options.isArchived ? 1 : 0);
    }

    if (options?.categoryId) {
      sql += ' AND category_id = ?';
      params.push(options.categoryId);
    }

    const sortCol =
      options?.sort === 'title' ? 'title' : 'created_at';
    const orderDir = options?.order === 'desc' ? 'DESC' : 'ASC';

    sql += ` ORDER BY ${sortCol} ${orderDir}`;

    const rows = this.db.prepare(sql).all(...params);
    return rows.map((r) => this.mapRowToEntity(r));
  }

  public async save(habit: Habit): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO habits (
        id, user_id, category_id, title, description, frequency_type,
        frequency_payload, target_type, target_value, unit, reminder_time,
        color, icon, is_archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      habit.id,
      habit.userId,
      habit.categoryId,
      habit.title,
      habit.description,
      habit.frequencyType,
      habit.frequencyPayload ? JSON.stringify(habit.frequencyPayload) : null,
      habit.targetType,
      habit.targetValue,
      habit.unit,
      habit.reminderTime,
      habit.color,
      habit.icon,
      habit.isArchived ? 1 : 0,
      habit.createdAt.toISOString(),
      habit.updatedAt.toISOString()
    );
  }

  public async update(habit: Habit): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE habits
      SET category_id = ?, title = ?, description = ?, frequency_type = ?,
          frequency_payload = ?, target_type = ?, target_value = ?, unit = ?,
          reminder_time = ?, color = ?, icon = ?, is_archived = ?, updated_at = ?
      WHERE id = ? AND user_id = ?
    `);

    stmt.run(
      habit.categoryId,
      habit.title,
      habit.description,
      habit.frequencyType,
      habit.frequencyPayload ? JSON.stringify(habit.frequencyPayload) : null,
      habit.targetType,
      habit.targetValue,
      habit.unit,
      habit.reminderTime,
      habit.color,
      habit.icon,
      habit.isArchived ? 1 : 0,
      new Date().toISOString(),
      habit.id,
      habit.userId
    );
  }

  public async delete(id: string): Promise<void> {
    this.db.prepare('DELETE FROM habits WHERE id = ?').run(id);
  }

  public async countActive(userId?: string): Promise<number> {
    let sql = 'SELECT COUNT(*) as count FROM habits WHERE is_archived = 0';
    const params: any[] = [];
    if (userId) {
      sql += ' AND user_id = ?';
      params.push(userId);
    }
    const row = this.db.prepare(sql).get(...params) as { count: number };
    return row ? row.count : 0;
  }

  public async countTotal(): Promise<number> {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM habits').get() as { count: number };
    return row ? row.count : 0;
  }
}
