import { IHabitRepository, HabitFilterOptions } from '../ports/habit.repository.port.js';
import { IStreakRepository } from '../ports/streak.repository.port.js';

export class ListHabitsUseCase {
  constructor(
    private readonly habitRepo: IHabitRepository,
    private readonly streakRepo: IStreakRepository
  ) {}

  public async execute(userId: string, options?: HabitFilterOptions) {
    const habits = await this.habitRepo.findByUserId(userId, options);

    const enrichedHabits = await Promise.all(
      habits.map(async (habit) => {
        const streak = await this.streakRepo.findByHabitId(habit.id);
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
      })
    );

    if (options?.sort === 'streak') {
      enrichedHabits.sort((a, b) => {
        const streakA = a.streak.currentStreak;
        const streakB = b.streak.currentStreak;
        return options.order === 'asc' ? streakA - streakB : streakB - streakA;
      });
    }

    return enrichedHabits;
  }
}
