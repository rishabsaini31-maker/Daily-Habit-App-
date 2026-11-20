import { v4 as uuidv4 } from 'uuid';
import { ICompletionRepository } from '../ports/completion.repository.port.js';
import { IHabitRepository } from '../ports/habit.repository.port.js';
import { IStreakRepository } from '../ports/streak.repository.port.js';
import { IUserRepository } from '../ports/user.repository.port.js';
import { IClockService } from '../ports/clock.service.port.js';
import { StreakRecord } from '../../domain/entities/streak.entity.js';
import { StreakCalculator } from '../../domain/services/streak-calculator.js';
import { NotFoundError } from '../../domain/errors/domain.error.js';

export class DeleteCompletionUseCase {
  constructor(
    private readonly completionRepo: ICompletionRepository,
    private readonly habitRepo: IHabitRepository,
    private readonly streakRepo: IStreakRepository,
    private readonly userRepo: IUserRepository,
    private readonly clockService: IClockService
  ) {}

  public async execute(habitId: string, date: string, userId: string) {
    const habit = await this.habitRepo.findById(habitId);
    if (!habit || habit.userId !== userId) {
      throw new NotFoundError('Habit not found.');
    }

    const deleted = await this.completionRepo.delete(habitId, date);
    if (!deleted) {
      throw new NotFoundError('No completion found for the specified date.');
    }

    const user = await this.userRepo.findById(userId);
    const timezone = user?.timezone || 'UTC';
    const userToday = this.clockService.today(timezone);

    // Recalculate streak after deletion
    const allCompletions = await this.completionRepo.findByHabitId(habitId);
    const existingStreak = await this.streakRepo.findByHabitId(habitId);

    const streakResult = StreakCalculator.calculate({
      habitId,
      frequencyType: habit.frequencyType,
      frequencyPayload: habit.frequencyPayload,
      completions: allCompletions,
      userToday,
      existingLongestStreak: existingStreak?.longestStreak ?? 0,
      freezeCountRemaining: existingStreak?.freezeCountRemaining ?? 1,
    });

    const updatedStreak = new StreakRecord({
      id: existingStreak ? existingStreak.id : uuidv4(),
      habitId,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      lastCompletedDate: streakResult.lastCompletedDate,
      freezeCountRemaining: streakResult.freezeCountRemaining,
      updatedAt: new Date(),
    });

    await this.streakRepo.save(updatedStreak);

    return {
      dateDeleted: date,
      updatedStreak: updatedStreak.toJSON(),
    };
  }
}
