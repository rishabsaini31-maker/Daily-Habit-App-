// ==============================================================================
// REPOSITORY: PgUserRepository
// PostgreSQL Implementation of User Repository
// ==============================================================================

import { IUserRepository, UserFilterOptions } from '../../../usecases/ports/user.repository.port.js';
import { User, UserRole, UserStatus } from '../../../domain/entities/user.entity.js';
import { PgConnection } from '../pg-connection.js';

export class PgUserRepository implements IUserRepository {
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
    const res = await PgConnection.query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows.length > 0 ? this.mapRowToEntity(res.rows[0]) : null;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const res = await PgConnection.query('SELECT * FROM users WHERE email = $1', [email]);
    return res.rows.length > 0 ? this.mapRowToEntity(res.rows[0]) : null;
  }

  public async save(user: User): Promise<void> {
    await PgConnection.query(
      `INSERT INTO users (id, email, password_hash, display_name, role, status, timezone, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        user.id,
        user.email,
        user.passwordHash,
        user.displayName,
        user.role,
        user.status,
        user.timezone,
        user.createdAt.toISOString(),
        user.updatedAt.toISOString(),
      ]
    );
  }

  public async update(user: User): Promise<void> {
    await PgConnection.query(
      `UPDATE users
       SET email = $1, password_hash = $2, display_name = $3, role = $4, status = $5, timezone = $6, updated_at = NOW()
       WHERE id = $7`,
      [
        user.email,
        user.passwordHash,
        user.displayName,
        user.role,
        user.status,
        user.timezone,
        user.id,
      ]
    );
  }

  public async findAll(options: UserFilterOptions): Promise<{ users: User[]; total: number }> {
    const { page, limit, search, status } = options;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    let params: any[] = [];
    let paramIdx = 1;

    if (search) {
      whereClauses.push(`(email ILIKE $${paramIdx} OR display_name ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (status) {
      whereClauses.push(`status = $${paramIdx}`);
      params.push(status);
      paramIdx++;
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await PgConnection.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM users ${whereSql}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const queryParams = [...params, limit, offset];
    const dataRes = await PgConnection.query(
      `SELECT * FROM users ${whereSql} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      queryParams
    );

    return {
      users: dataRes.rows.map((r) => this.mapRowToEntity(r)),
      total,
    };
  }

  public async countAll(): Promise<number> {
    const res = await PgConnection.query<{ count: string }>('SELECT COUNT(*) as count FROM users');
    return parseInt(res.rows[0]?.count || '0', 10);
  }

  public async countActive(): Promise<number> {
    const res = await PgConnection.query<{ count: string }>(
      "SELECT COUNT(*) as count FROM users WHERE status = 'ACTIVE'"
    );
    return parseInt(res.rows[0]?.count || '0', 10);
  }
}

export default PgUserRepository;
