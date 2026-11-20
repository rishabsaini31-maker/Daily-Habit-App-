import { AuditLog } from '../../domain/entities/audit-log.entity.js';

export interface AuditLogFilterOptions {
  page: number;
  limit: number;
  actorId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}

export interface IAuditLogRepository {
  save(log: AuditLog): Promise<void>;
  findAll(options: AuditLogFilterOptions): Promise<{ logs: AuditLog[]; total: number }>;
}
