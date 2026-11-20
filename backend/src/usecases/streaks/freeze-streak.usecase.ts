import { v4 as uuidv4 } from 'uuid';
import { IHabitRepository } from '../ports/habit.repository.port.js';
import { IStreakRepository } from '../ports/streak.repository.port.js';
import { ICompletionRepository } from '../ports/completion.repository.port.js';
import { IUserRepository } from '../ports/user.repository.port.js';
import { IClockService } from '../ports/clock.service.port.js';
import { HabitCompletion } from '../../domain/entities/completion.entity.js';
import { StreakRecord } from '../../domain/entities/streak.entity.js';
import { StreakCalculator } from '../../domain/services/streak-calculator.js';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.error.js';

export interface FreezeStreakDTO {
  habitId: string;
  userId: string;
  missedDate: string; // YYYY-MM-DD
}

export class FreezeStreakUseCase {
  constructor(
    private readonly habitRepo: IHabitRepository,
    private readonly streakRepo: IStreakRepository,
    private readonly completionRepo: ICompletionRepository,
    private readonly userRepo: IUserRepository,
    private readonly clockService: IClockService
  ) {}

  public async execute(dto: FreezeStreakDTO) {
    const habit = await this.habitRepo.findById(dto.habitId);
    if (!habit || habit.userId !== dto.userId) {
      throw new NotFoundError('Habit not found.');
    }

    const existingStreak = await this.streakRepo.findByHabitId(dto.habitId);
    const freezeCountRemaining = existingStreak ? existingStreak.freezeCountRemaining : 1;

    if (freezeCountRemaining <= 0) {
      throw new ValidationError('No streak freezes remaining for this habit this period.');
    }

    // Record an excused/frozen completion for the missed date
    const freezeCompletion = new HabitCompletion({
      id: uuidv4(),
      habitId: dto.habitId,
      userId: dto.userId,
      date: dto.missedDate,
      status: 'SKIPPED',
      value: 0,
      notes: 'STREAK_FREEZE',
      completedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.completionRepo.save(freezeCompletion);

    const user = await this.userRepo.findById(dto.userId);
    const timezone = user?.timezone || 'UTC';
    const userToday = this.clockService.today(timezone);

    const allCompletions = await this.completionRepo.findByHabitId(dto.habitId);

    const streakResult = StreakCalculator.calculate({
      habitId: dto.habitId,
      frequencyType: habit.frequencyType,
      frequencyPayload: habit.frequencyPayload,
      completions: allCompletions,
      userToday,
      existingLongestStreak: existingStreak?.longestStreak ?? 0,
      freezeCountRemaining: freezeCountRemaining - 1,
    });

    const updatedStreak = new StreakRecord({
      id: existingStreak ? existingStreak.id : uuidv4(),
      habitId: dto.habitId,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      lastCompletedDate: streakResult.lastCompletedDate,
      freezeCountRemaining: freezeCountRemaining - 1,
      updatedAt: new Date(),
    });

    await this.streakRepo.save(updatedStreak);

    return updatedStreak.toJSON();
  }
}
