import { v4 as uuidv4 } from 'uuid';
import { ITemplateRepository } from '../ports/template.repository.port.js';
import { ICategoryRepository } from '../ports/category.repository.port.js';
import { IAuditLogRepository } from '../ports/audit-log.repository.port.js';
import { HabitTemplate } from '../../domain/entities/template.entity.js';
import { AuditLog } from '../../domain/entities/audit-log.entity.js';
import { FrequencyType } from '../../domain/value-objects/frequency-type.vo.js';
import { TargetType } from '../../domain/value-objects/target-type.vo.js';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.error.js';

export interface CreateTemplateDTO {
  adminId: string;
  adminEmail?: string;
  title: string;
  description: string;
  categoryId: string;
  frequencyType: FrequencyType;
  frequencyPayload?: number[] | null;
  targetType: TargetType;
  targetValue?: number | null;
  unit?: string | null;
  icon: string;
  color: string;
  isPublished?: boolean;
  ipAddress?: string | null;
}

export class CreateTemplateUseCase {
  constructor(
    private readonly templateRepo: ITemplateRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly auditLogRepo: IAuditLogRepository
  ) {}

  public async execute(dto: CreateTemplateDTO) {
    const category = await this.categoryRepo.findById(dto.categoryId);
    if (!category) {
      throw new NotFoundError('Category not found.');
    }

    if (!dto.title || dto.title.trim().length < 2) {
      throw new ValidationError('Template title must be at least 2 characters.');
    }

    const templateId = uuidv4();
    const template = new HabitTemplate({
      id: templateId,
      title: dto.title.trim(),
      description: dto.description.trim(),
      categoryId: dto.categoryId,
      frequencyType: dto.frequencyType || 'DAILY',
      frequencyPayload: dto.frequencyPayload || null,
      targetType: dto.targetType || 'BOOLEAN',
      targetValue: dto.targetValue !== undefined ? dto.targetValue : null,
      unit: dto.unit || null,
      icon: dto.icon || 'star',
      color: dto.color || '#3B82F6',
      isPublished: dto.isPublished !== undefined ? dto.isPublished : true,
      createdBy: dto.adminId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.templateRepo.save(template);

    const auditLog = new AuditLog({
      id: uuidv4(),
      actorId: dto.adminId,
      actorEmail: dto.adminEmail,
      action: 'TEMPLATE_CREATE',
      entityType: 'template',
      entityId: template.id,
      details: { title: template.title, categoryId: template.categoryId },
      ipAddress: dto.ipAddress || null,
      createdAt: new Date(),
    });

    await this.auditLogRepo.save(auditLog);

    return template.toJSON();
  }
}
