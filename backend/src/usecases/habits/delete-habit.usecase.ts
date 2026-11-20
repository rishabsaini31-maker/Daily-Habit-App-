import { IHabitRepository } from '../ports/habit.repository.port.js';
import { NotFoundError } from '../../domain/errors/domain.error.js';

export class DeleteHabitUseCase {
  constructor(private readonly habitRepo: IHabitRepository) {}

  public async execute(habitId: string, userId: string) {
    const habit = await this.habitRepo.findById(habitId);
    if (!habit || habit.userId !== userId) {
      throw new NotFoundError('Habit not found.');
    }

    await this.habitRepo.delete(habitId);
    return { success: true, message: 'Habit deleted successfully.' };
  }
}
