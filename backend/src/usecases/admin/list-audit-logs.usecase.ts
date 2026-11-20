import { IAuditLogRepository, AuditLogFilterOptions } from '../ports/audit-log.repository.port.js';

export class ListAuditLogsUseCase {
  constructor(private readonly auditLogRepo: IAuditLogRepository) {}

  public async execute(options: AuditLogFilterOptions) {
    const { logs, total } = await this.auditLogRepo.findAll(options);
    return {
      logs: logs.map((l) => l.toJSON()),
      meta: {
        page: options.page,
        limit: options.limit,
        total,
      },
    };
  }
}
