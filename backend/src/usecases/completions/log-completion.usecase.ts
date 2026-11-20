import { v4 as uuidv4 } from 'uuid';
import { ICompletionRepository } from '../ports/completion.repository.port.js';
import { IHabitRepository } from '../ports/habit.repository.port.js';
import { IStreakRepository } from '../ports/streak.repository.port.js';
import { IUserRepository } from '../ports/user.repository.port.js';
import { IClockService } from '../ports/clock.service.port.js';
import { HabitCompletion, CompletionStatus } from '../../domain/entities/completion.entity.js';
import { StreakRecord } from '../../domain/entities/streak.entity.js';
import { StreakCalculator } from '../../domain/services/streak-calculator.js';
import { TimezoneResolver } from '../../domain/services/timezone-resolver.js';
import {
  CompletionWindowExceededError,
  NotFoundError,
  ValidationError,
} from '../../domain/errors/domain.error.js';

export interface LogCompletionDTO {
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  status?: CompletionStatus;
  value?: number;
  notes?: string | null;
}

export class LogCompletionUseCase {
  constructor(
    private readonly completionRepo: ICompletionRepository,
    private readonly habitRepo: IHabitRepository,
    private readonly streakRepo: IStreakRepository,
    private readonly userRepo: IUserRepository,
    private readonly clockService: IClockService
  ) {}

  public async execute(dto: LogCompletionDTO) {
    const habit = await this.habitRepo.findById(dto.habitId);
    if (!habit || habit.userId !== dto.userId) {
      throw new NotFoundError('Habit not found.');
    }

    const user = await this.userRepo.findById(dto.userId);
    const timezone = user?.timezone || 'UTC';
    const userToday = this.clockService.today(timezone);

    // Validate 48h backfill window
    const windowValidation = TimezoneResolver.isWithinBackfillWindow(dto.date, userToday, 2);
    if (!windowValidation.valid) {
      throw new CompletionWindowExceededError(windowValidation.reason);
    }

    const status: CompletionStatus = dto.status || 'COMPLETED';
    let value = dto.value !== undefined ? dto.value : 1;

    // For numeric habits, check if progress reached targetValue if status not explicitly provided
    if (habit.targetType === 'NUMERIC' && habit.targetValue && dto.status === undefined) {
      if (value >= habit.targetValue) {
        // completed
      }
    }

    const existingCompletion = await this.completionRepo.findByHabitAndDate(dto.habitId, dto.date);

    const completion = new HabitCompletion({
      id: existingCompletion ? existingCompletion.id : uuidv4(),
      habitId: dto.habitId,
      userId: dto.userId,
      date: dto.date,
      status,
      value,
      notes: dto.notes !== undefined ? dto.notes : (existingCompletion?.notes ?? null),
      completedAt: new Date(),
      createdAt: existingCompletion ? existingCompletion.createdAt : new Date(),
      updatedAt: new Date(),
    });

    await this.completionRepo.save(completion);

    // Fetch all completions to recalculate streak deterministically
    const allCompletions = await this.completionRepo.findByHabitId(dto.habitId);
    const existingStreak = await this.streakRepo.findByHabitId(dto.habitId);

    const streakResult = StreakCalculator.calculate({
      habitId: habit.id,
      frequencyType: habit.frequencyType,
      frequencyPayload: habit.frequencyPayload,
      completions: allCompletions,
      userToday,
      existingLongestStreak: existingStreak?.longestStreak ?? 0,
      freezeCountRemaining: existingStreak?.freezeCountRemaining ?? 1,
    });

    const updatedStreak = new StreakRecord({
      id: existingStreak ? existingStreak.id : uuidv4(),
      habitId: habit.id,
      currentStreak: streakResult.currentStreak,
      longestStreak: streakResult.longestStreak,
      lastCompletedDate: streakResult.lastCompletedDate,
      freezeCountRemaining: streakResult.freezeCountRemaining,
      updatedAt: new Date(),
    });

    await this.streakRepo.save(updatedStreak);

    return {
      completion: completion.toJSON(),
      streak: updatedStreak.toJSON(),
    };
  }
}
