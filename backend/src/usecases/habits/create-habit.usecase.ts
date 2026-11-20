import { v4 as uuidv4 } from 'uuid';
import { IHabitRepository } from '../ports/habit.repository.port.js';
import { IStreakRepository } from '../ports/streak.repository.port.js';
import { ICategoryRepository } from '../ports/category.repository.port.js';
import { Habit } from '../../domain/entities/habit.entity.js';
import { StreakRecord } from '../../domain/entities/streak.entity.js';
import { FrequencyType } from '../../domain/value-objects/frequency-type.vo.js';
import { TargetType } from '../../domain/value-objects/target-type.vo.js';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.error.js';

export interface CreateHabitDTO {
  userId: string;
  title: string;
  description?: string | null;
  categoryId: string;
  frequencyType: FrequencyType;
  frequencyPayload?: number[] | null;
  targetType: TargetType;
  targetValue?: number | null;
  unit?: string | null;
  reminderTime?: string | null;
  color?: string;
  icon?: string;
}

export class CreateHabitUseCase {
  constructor(
    private readonly habitRepo: IHabitRepository,
    private readonly streakRepo: IStreakRepository,
    private readonly categoryRepo: ICategoryRepository
  ) {}

  public async execute(dto: CreateHabitDTO) {
    const category = await this.categoryRepo.findById(dto.categoryId);
    if (!category) {
      throw new NotFoundError('Selected category does not exist.');
    }

    if (!dto.title || dto.title.trim().length === 0) {
      throw new ValidationError('Habit title cannot be empty.');
    }

    if (dto.targetType === 'NUMERIC' && (!dto.targetValue || dto.targetValue <= 0)) {
      throw new ValidationError('Numeric habits must specify a positive target value.');
    }

    const habitId = uuidv4();
    const habit = new Habit({
      id: habitId,
      userId: dto.userId,
      categoryId: dto.categoryId,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      frequencyType: dto.frequencyType || 'DAILY',
      frequencyPayload: dto.frequencyPayload || null,
      targetType: dto.targetType || 'BOOLEAN',
      targetValue: dto.targetValue !== undefined ? dto.targetValue : null,
      unit: dto.unit || null,
      reminderTime: dto.reminderTime || null,
      color: dto.color || '#3B82F6',
      icon: dto.icon || 'check-circle',
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.habitRepo.save(habit);

    const streakRecord = new StreakRecord({
      id: uuidv4(),
      habitId,
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      freezeCountRemaining: 1,
      updatedAt: new Date(),
    });

    await this.streakRepo.save(streakRecord);

    return {
      ...habit.toJSON(),
      streak: streakRecord.toJSON(),
    };
  }
}
