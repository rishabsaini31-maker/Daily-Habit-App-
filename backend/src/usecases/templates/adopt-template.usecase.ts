import { v4 as uuidv4 } from 'uuid';
import { ITemplateRepository } from '../ports/template.repository.port.js';
import { IHabitRepository } from '../ports/habit.repository.port.js';
import { IStreakRepository } from '../ports/streak.repository.port.js';
import { Habit } from '../../domain/entities/habit.entity.js';
import { StreakRecord } from '../../domain/entities/streak.entity.js';
import { NotFoundError } from '../../domain/errors/domain.error.js';

export class AdoptTemplateUseCase {
  constructor(
    private readonly templateRepo: ITemplateRepository,
    private readonly habitRepo: IHabitRepository,
    private readonly streakRepo: IStreakRepository
  ) {}

  public async execute(templateId: string, userId: string) {
    const template = await this.templateRepo.findById(templateId);
    if (!template || !template.isPublished) {
      throw new NotFoundError('Habit template not found.');
    }

    const habitId = uuidv4();
    const habit = new Habit({
      id: habitId,
      userId,
      categoryId: template.categoryId,
      title: template.title,
      description: template.description,
      frequencyType: template.frequencyType,
      frequencyPayload: template.frequencyPayload,
      targetType: template.targetType,
      targetValue: template.targetValue,
      unit: template.unit,
      reminderTime: null,
      color: template.color,
      icon: template.icon,
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
