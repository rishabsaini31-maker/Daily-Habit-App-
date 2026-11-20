import { Database as DatabaseType } from 'better-sqlite3';
import { IUserRepository, UserFilterOptions } from '../../../usecases/ports/user.repository.port.js';
import { User, UserRole, UserStatus } from '../../../domain/entities/user.entity.js';

export class SqliteUserRepository implements IUserRepository {
  constructor(private readonly db: DatabaseType) {}

  private mapRowToEntity(row: any): User {
    return new User({
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      displayName: row.display_name,
      role: row.role as UserRole,
      status: row.status as UserStatus,
      timezone: row.timezone,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  public async findById(id: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return row ? this.mapRowToEntity(row) : null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    return row ? this.mapRowToEntity(row) : null;
  }

  public async save(user: User): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, role, status, timezone, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      user.id,
      user.email,
      user.passwordHash,
      user.displayName,
      user.role,
      user.status,
      user.timezone,
      user.createdAt.toISOString(),
      user.updatedAt.toISOString()
    );
  }

  public async update(user: User): Promise<void> {
    const stmt = this.db.prepare(`
      UPDATE users
      SET email = ?, password_hash = ?, display_name = ?, role = ?, status = ?, timezone = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(
      user.email,
      user.passwordHash,
      user.displayName,
      user.role,
      user.status,
      user.timezone,
      new Date().toISOString(),
      user.id
    );
  }

  public async findAll(options: UserFilterOptions): Promise<{ users: User[]; total: number }> {
    const { page, limit, search, status } = options;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (search) {
      whereClauses.push('(email LIKE ? OR display_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClauses.push('status = ?');
      params.push(status);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = this.db
      .prepare(`SELECT COUNT(*) as count FROM users ${whereSql}`)
      .get(...params) as { count: number };
    const total = countRow ? countRow.count : 0;

    const rows = this.db
      .prepare(`SELECT * FROM users ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);

    return {
      users: rows.map((r) => this.mapRowToEntity(r)),
      total,
    };
  }

  public async countAll(): Promise<number> {
    const row = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    return row ? row.count : 0;
  }

  public async countActive(): Promise<number> {
    const row = this.db
      .prepare("SELECT COUNT(*) as count FROM users WHERE status = 'ACTIVE'")
      .get() as { count: number };
    return row ? row.count : 0;
  }
}
