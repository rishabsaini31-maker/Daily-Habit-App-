import { ICompletionRepository, CompletionFilterOptions } from '../ports/completion.repository.port.js';
import { IHabitRepository } from '../ports/habit.repository.port.js';
import { NotFoundError } from '../../domain/errors/domain.error.js';

export class GetCompletionsUseCase {
  constructor(
    private readonly completionRepo: ICompletionRepository,
    private readonly habitRepo: IHabitRepository
  ) {}

  public async execute(habitId: string, userId: string, options?: CompletionFilterOptions) {
    const habit = await this.habitRepo.findById(habitId);
    if (!habit || habit.userId !== userId) {
      throw new NotFoundError('Habit not found.');
    }

    const completions = await this.completionRepo.findByHabitId(habitId, options);
    return completions.map((c) => c.toJSON());
  }
}
