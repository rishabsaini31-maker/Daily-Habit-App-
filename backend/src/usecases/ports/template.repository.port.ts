import { HabitTemplate } from '../../domain/entities/template.entity.js';

export interface TemplateFilterOptions {
  categoryId?: string;
  search?: string;
  publishedOnly?: boolean;
}

export interface ITemplateRepository {
  findById(id: string): Promise<HabitTemplate | null>;
  findAll(options?: TemplateFilterOptions): Promise<HabitTemplate[]>;
  save(template: HabitTemplate): Promise<void>;
  update(template: HabitTemplate): Promise<void>;
  delete(id: string): Promise<void>;
}
