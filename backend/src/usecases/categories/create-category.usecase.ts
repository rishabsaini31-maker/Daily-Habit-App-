import { v4 as uuidv4 } from 'uuid';
import { ICategoryRepository } from '../ports/category.repository.port.js';
import { Category } from '../../domain/entities/category.entity.js';
import { ConflictError, ValidationError } from '../../domain/errors/domain.error.js';

export interface CreateCategoryDTO {
  name: string;
  icon: string;
  color: string;
}

export class CreateCategoryUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  public async execute(dto: CreateCategoryDTO) {
    const trimmedName = dto.name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      throw new ValidationError('Category name must be at least 2 characters long.');
    }

    const existing = await this.categoryRepo.findByName(trimmedName);
    if (existing) {
      throw new ConflictError('A category with this name already exists.');
    }

    const category = new Category({
      id: uuidv4(),
      name: trimmedName,
      icon: dto.icon || 'tag',
      color: dto.color || '#3B82F6',
      isSystem: false,
      createdAt: new Date(),
    });

    await this.categoryRepo.save(category);
    return category.toJSON();
  }
}
