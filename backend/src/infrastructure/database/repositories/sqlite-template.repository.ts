import { Database as DatabaseType } from 'better-sqlite3';
import { ITemplateRepository, TemplateFilterOptions } from '../../../usecases/ports/template.repository.port.js';
import { HabitTemplate } from '../../../domain/entities/template.entity.js';
import { FrequencyType } from '../../../domain/value-objects/frequency-type.vo.js';
import { TargetType } from '../../../domain/value-objects/target-type.vo.js';

export class SqliteTemplateRepository implements ITemplateRepository {
  constructor(private readonly db: DatabaseType) {}

  private mapRowToEntity(row: any): HabitTemplate {
    let frequencyPayload: number[] | null = null;
    if (row.frequency_payload) {
      try {
        frequencyPayload = JSON.parse(row.frequency_payload);
      } catch {
        frequencyPayload = null;
      }
    }

    return new HabitTemplate({
      id: row.id,
      title: row.title,
      description: row.description,
      categoryId: row.category_id,
      frequencyType: row.frequency_type as FrequencyType,
      frequencyPayload,
      targetType: row.target_type as TargetType,
      targetValue: row.target_value !== null ? Number(row.target_value) : null,
      unit: row.unit,
      icon: row.icon,
      color: row.color,
      isPublished: Boolean(row.is_published),
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  public async findById(id: string): Promise<HabitTemplate | null> {
    const row = this.db.prepare('SELECT * FROM habit_templates WHERE id = ?').get(id);
    return row ? this.mapRowToEntity(row) : null;
  }

  public async findAll(options?: TemplateFilterOptions): Promise<HabitTemplate[]> {
    let sql = 'SELECT * FROM habit_templates WHERE 1=1';
    const params: any[] = [];

    if (options?.publishedOnly) {
      sql += ' AND is_published = 1';
    }

    if (options?.categoryId) {
      sql += ' AND category_id = ?';
      params.push(options.categoryId);
    }

    if (options?.search) {
      sql += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${options.search}%`, `%${options.search}%`);
    }

    sql += ' ORDER BY created_at DESC';

    const rows = this.db.prepare(sql).all(...params);
    return rows.map((r) => this.mapRowToEntity(r));
  }

  public async save(template: HabitTemplate): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO habit_templates (
        id, title, description, category_id, frequency_type, frequency_payload,
        target_type, target_value, unit, icon, color, is_published, created_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      template.id,
      template.title,
      template.description,
      template.categoryId,
      template.frequencyType,
      template.frequencyPayload ? JSON.stringify(template.frequencyPayload) : null,
      template.targetType,
      template.targetValue,
      template.unit,
      template.icon,
      template.color,
      template.isPublished ? 1 : 0,
      template.createdBy,
      template.createdAt.toISOString(),
      template.updatedAt.toISOString()
    );
  }

  public async update(template: HabitTemplate): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE habit_templates
      SET title = ?, description = ?, category_id = ?, frequency_type = ?,
          frequency_payload = ?, target_type = ?, target_value = ?, unit = ?,
          icon = ?, color = ?, is_published = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      template.title,
      template.description,
      template.categoryId,
      template.frequencyType,
      template.frequencyPayload ? JSON.stringify(template.frequencyPayload) : null,
      template.targetType,
      template.targetValue,
      template.unit,
      template.icon,
      template.color,
      template.isPublished ? 1 : 0,
      new Date().toISOString(),
      template.id
    );
  }

  public async delete(id: string): Promise<void> {
    this.db.prepare('DELETE FROM habit_templates WHERE id = ?').run(id);
  }
}
