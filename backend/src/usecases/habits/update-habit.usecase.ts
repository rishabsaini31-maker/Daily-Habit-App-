import { IHabitRepository } from '../ports/habit.repository.port.js';
import { IStreakRepository } from '../ports/streak.repository.port.js';
import { ICategoryRepository } from '../ports/category.repository.port.js';
import { Habit } from '../../domain/entities/habit.entity.js';
import { NotFoundError, ValidationError } from '../../domain/errors/domain.error.js';

export interface UpdateHabitDTO {
  habitId: string;
  userId: string;
  title?: string;
  description?: string | null;
  categoryId?: string;
  reminderTime?: string | null;
  color?: string;
  icon?: string;
}

export class UpdateHabitUseCase {
  constructor(
    private readonly habitRepo: IHabitRepository,
    private readonly streakRepo: IStreakRepository,
    private readonly categoryRepo: ICategoryRepository
  ) {}

  public async execute(dto: UpdateHabitDTO) {
    const habit = await this.habitRepo.findById(dto.habitId);
    if (!habit || habit.userId !== dto.userId) {
      throw new NotFoundError('Habit not found.');
    }

    let categoryId = habit.categoryId;
    if (dto.categoryId && dto.categoryId !== habit.categoryId) {
      const category = await this.categoryRepo.findById(dto.categoryId);
      if (!category) {
        throw new NotFoundError('Target category not found.');
      }
      categoryId = dto.categoryId;
    }

    if (dto.title !== undefined && dto.title.trim().length === 0) {
      throw new ValidationError('Habit title cannot be empty.');
    }

    const updatedHabit = new Habit({
      id: habit.id,
      userId: habit.userId,
      categoryId,
      title: dto.title !== undefined ? dto.title.trim() : habit.title,
      description: dto.description !== undefined ? dto.description : habit.description,
      frequencyType: habit.frequencyType,
      frequencyPayload: habit.frequencyPayload,
      targetType: habit.targetType,
      targetValue: habit.targetValue,
      unit: habit.unit,
      reminderTime: dto.reminderTime !== undefined ? dto.reminderTime : habit.reminderTime,
      color: dto.color !== undefined ? dto.color : habit.color,
      icon: dto.icon !== undefined ? dto.icon : habit.icon,
      isArchived: habit.isArchived,
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
