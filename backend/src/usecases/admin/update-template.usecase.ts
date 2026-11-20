import { v4 as uuidv4 } from 'uuid';
import { ITemplateRepository } from '../ports/template.repository.port.js';
import { ICategoryRepository } from '../ports/category.repository.port.js';
import { IAuditLogRepository } from '../ports/audit-log.repository.port.js';
import { HabitTemplate } from '../../domain/entities/template.entity.js';
import { AuditLog } from '../../domain/entities/audit-log.entity.js';
import { FrequencyType } from '../../domain/value-objects/frequency-type.vo.js';
import { TargetType } from '../../domain/value-objects/target-type.vo.js';
import { NotFoundError } from '../../domain/errors/domain.error.js';

export interface UpdateTemplateDTO {
  templateId: string;
  adminId: string;
  adminEmail?: string;
  title?: string;
  description?: string;
  categoryId?: string;
  frequencyType?: FrequencyType;
  frequencyPayload?: number[] | null;
  targetType?: TargetType;
  targetValue?: number | null;
  unit?: string | null;
  icon?: string;
  color?: string;
  isPublished?: boolean;
  ipAddress?: string | null;
}

export class UpdateTemplateUseCase {
  constructor(
    private readonly templateRepo: ITemplateRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly auditLogRepo: IAuditLogRepository
  ) {}

  public async execute(dto: UpdateTemplateDTO) {
    const template = await this.templateRepo.findById(dto.templateId);
    if (!template) {
      throw new NotFoundError('Template not found.');
    }

    if (dto.categoryId && dto.categoryId !== template.categoryId) {
      const category = await this.categoryRepo.findById(dto.categoryId);
      if (!category) {
        throw new NotFoundError('Category not found.');
      }
    }

    const updatedTemplate = new HabitTemplate({
      id: template.id,
      title: dto.title !== undefined ? dto.title.trim() : template.title,
      description: dto.description !== undefined ? dto.description.trim() : template.description,
      categoryId: dto.categoryId || template.categoryId,
      frequencyType: dto.frequencyType || template.frequencyType,
      frequencyPayload: dto.frequencyPayload !== undefined ? dto.frequencyPayload : template.frequencyPayload,
      targetType: dto.targetType || template.targetType,
      targetValue: dto.targetValue !== undefined ? dto.targetValue : template.targetValue,
      unit: dto.unit !== undefined ? dto.unit : template.unit,
      icon: dto.icon || template.icon,
      color: dto.color || template.color,
      isPublished: dto.isPublished !== undefined ? dto.isPublished : template.isPublished,
      createdBy: template.createdBy,
      createdAt: template.createdAt,
      updatedAt: new Date(),
    });

    await this.templateRepo.update(updatedTemplate);

    const auditLog = new AuditLog({
      id: uuidv4(),
      actorId: dto.adminId,
      actorEmail: dto.adminEmail,
      action: 'TEMPLATE_UPDATE',
      entityType: 'template',
      entityId: template.id,
      details: { title: updatedTemplate.title, isPublished: updatedTemplate.isPublished },
      ipAddress: dto.ipAddress || null,
      createdAt: new Date(),
    });

    await this.auditLogRepo.save(auditLog);

    return updatedTemplate.toJSON();
  }
}
