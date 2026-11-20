import { ITemplateRepository, TemplateFilterOptions } from '../ports/template.repository.port.js';

export class ListTemplatesUseCase {
  constructor(private readonly templateRepo: ITemplateRepository) {}

  public async execute(options?: TemplateFilterOptions) {
    const templates = await this.templateRepo.findAll({
      ...options,
      publishedOnly: true,
    });
    return templates.map((t) => t.toJSON());
  }
}
