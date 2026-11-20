import { Database as DatabaseType } from 'better-sqlite3';
import { IAuditLogRepository, AuditLogFilterOptions } from '../../../usecases/ports/audit-log.repository.port.js';
import { AuditLog } from '../../../domain/entities/audit-log.entity.js';

export class SqliteAuditLogRepository implements IAuditLogRepository {
  constructor(private readonly db: DatabaseType) {}

  private mapRowToEntity(row: any): AuditLog {
    let details: Record<string, unknown> | null = null;
    if (row.details) {
      try {
        details = JSON.parse(row.details);
      } catch {
        details = null;
      }
    }

    return new AuditLog({
      id: row.id,
      actorId: row.actor_id,
      actorEmail: row.actor_email || undefined,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details,
      ipAddress: row.ip_address,
      createdAt: new Date(row.created_at),
    });
  }

  public async save(log: AuditLog): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (id, actor_id, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      log.id,
      log.actorId,
      log.action,
      log.entityType,
      log.entityId,
      log.details ? JSON.stringify(log.details) : null,
      log.ipAddress,
      log.createdAt.toISOString()
    );
  }

  public async findAll(options: AuditLogFilterOptions): Promise<{ logs: AuditLog[]; total: number }> {
    const { page, limit, actorId, action, startDate, endDate } = options;
    const offset = (page - 1) * limit;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (actorId) {
      whereClauses.push('a.actor_id = ?');
      params.push(actorId);
    }

    if (action) {
      whereClauses.push('a.action = ?');
      params.push(action);
    }

    if (startDate) {
      whereClauses.push('a.created_at >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('a.created_at <= ?');
      params.push(endDate);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = this.db
      .prepare(`SELECT COUNT(*) as count FROM audit_logs a ${whereSql}`)
      .get(...params) as { count: number };
    const total = countRow ? countRow.count : 0;

    const sql = `
      SELECT a.*, u.email as actor_email
      FROM audit_logs a
      LEFT JOIN users u ON a.actor_id = u.id
      ${whereSql}
      ORDER BY a.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = this.db.prepare(sql).all(...params, limit, offset);

    return {
      logs: rows.map((r) => this.mapRowToEntity(r)),
      total,
    };
  }
}
