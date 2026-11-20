import { IHabitRepository } from '../ports/habit.repository.port.js';
import { IStreakRepository } from '../ports/streak.repository.port.js';
import { Habit } from '../../domain/entities/habit.entity.js';
import { NotFoundError } from '../../domain/errors/domain.error.js';

export class ArchiveHabitUseCase {
  constructor(
    private readonly habitRepo: IHabitRepository,
    private readonly streakRepo: IStreakRepository
  ) {}

  public async execute(habitId: string, userId: string, isArchived: boolean) {
    const habit = await this.habitRepo.findById(habitId);
    if (!habit || habit.userId !== userId) {
      throw new NotFoundError('Habit not found.');
    }

    const updatedHabit = new Habit({
      id: habit.id,
      userId: habit.userId,
      categoryId: habit.categoryId,
      title: habit.title,
      description: habit.description,
      frequencyType: habit.frequencyType,
      frequencyPayload: habit.frequencyPayload,
      targetType: habit.targetType,
      targetValue: habit.targetValue,
      unit: habit.unit,
      reminderTime: habit.reminderTime,
      color: habit.color,
      icon: habit.icon,
      isArchived,
      createdAt: habit.createdAt,
      updatedAt: new Date(),
    });

    await this.habitRepo.update(updatedHabit);

    const streak = await this.streakRepo.findByHabitId(habit.id);

    return {
      ...updatedHabit.toJSON(),
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
