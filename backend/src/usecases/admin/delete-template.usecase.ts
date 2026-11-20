import { v4 as uuidv4 } from 'uuid';
import { ITemplateRepository } from '../ports/template.repository.port.js';
import { IAuditLogRepository } from '../ports/audit-log.repository.port.js';
import { AuditLog } from '../../domain/entities/audit-log.entity.js';
import { NotFoundError } from '../../domain/errors/domain.error.js';

export class DeleteTemplateUseCase {
  constructor(
    private readonly templateRepo: ITemplateRepository,
    private readonly auditLogRepo: IAuditLogRepository
  ) {}

  public async execute(templateId: string, adminId: string, adminEmail?: string, ipAddress?: string | null) {
    const template = await this.templateRepo.findById(templateId);
    if (!template) {
      throw new NotFoundError('Template not found.');
    }

    await this.templateRepo.delete(templateId);

    const auditLog = new AuditLog({
      id: uuidv4(),
      actorId: adminId,
      actorEmail: adminEmail,
      action: 'TEMPLATE_DELETE',
      entityType: 'template',
      entityId: templateId,
      details: { title: template.title },
      ipAddress: ipAddress || null,
      createdAt: new Date(),
    });

    await this.auditLogRepo.save(auditLog);

    return { success: true, message: 'Template deleted successfully.' };
  }
}
