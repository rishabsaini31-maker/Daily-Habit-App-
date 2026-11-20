import { IHabitRepository } from '../ports/habit.repository.port.js';
import { IStreakRepository } from '../ports/streak.repository.port.js';
import { NotFoundError } from '../../domain/errors/domain.error.js';

export class GetHabitUseCase {
  constructor(
    private readonly habitRepo: IHabitRepository,
    private readonly streakRepo: IStreakRepository
  ) {}

  public async execute(habitId: string, userId: string) {
    const habit = await this.habitRepo.findById(habitId);
    if (!habit || habit.userId !== userId) {
      throw new NotFoundError('Habit not found.');
    }

    const streak = await this.streakRepo.findByHabitId(habitId);

    return {
      ...habit.toJSON(),
      streak: streak
        ? streak.toJSON()
        : {
            currentStreak: 0,
            longestStreak: 0,
            lastCompletedDate: null,
            freezeCountRemaining: 1,
          },
    };
  }
}
