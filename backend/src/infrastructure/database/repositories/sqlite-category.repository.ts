import { Database as DatabaseType } from 'better-sqlite3';
import { ICategoryRepository } from '../../../usecases/ports/category.repository.port.js';
import { Category } from '../../../domain/entities/category.entity.js';

export class SqliteCategoryRepository implements ICategoryRepository {
  constructor(private readonly db: DatabaseType) {}

  private mapRowToEntity(row: any): Category {
    return new Category({
      id: row.id,
      name: row.name,
      icon: row.icon,
      color: row.color,
      isSystem: Boolean(row.is_system),
      createdAt: new Date(row.created_at),
    });
  }

  public async findById(id: string): Promise<Category | null> {
    const row = this.db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    return row ? this.mapRowToEntity(row) : null;
  }

  public async findByName(name: string): Promise<Category | null> {
    const row = this.db.prepare('SELECT * FROM categories WHERE name = ?').get(name);
    return row ? this.mapRowToEntity(row) : null;
  }

  public async findAll(): Promise<Category[]> {
    const rows = this.db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
    return rows.map((r) => this.mapRowToEntity(r));
  }

  public async save(category: Category): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO categories (id, name, icon, color, is_system, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      category.id,
      category.name,
      category.icon,
      category.color,
      category.isSystem ? 1 : 0,
      category.createdAt.toISOString()
    );
  }
}
