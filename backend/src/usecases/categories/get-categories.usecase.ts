import { ICategoryRepository } from '../ports/category.repository.port.js';

export class GetCategoriesUseCase {
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  public async execute() {
    const categories = await this.categoryRepo.findAll();
    return categories.map((c) => c.toJSON());
  }
}
