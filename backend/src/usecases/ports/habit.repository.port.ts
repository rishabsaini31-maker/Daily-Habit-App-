import { Habit } from '../../domain/entities/habit.entity.js';

export interface HabitFilterOptions {
  isArchived?: boolean;
  categoryId?: string;
  sort?: 'createdAt' | 'title' | 'streak';
  order?: 'asc' | 'desc';
}

export interface IHabitRepository {
  findById(id: string): Promise<Habit | null>;
  findByUserId(userId: string, options?: HabitFilterOptions): Promise<Habit[]>;
  save(habit: Habit): Promise<void>;
  update(habit: Habit): Promise<void>;
  delete(id: string): Promise<void>;
  countActive(userId?: string): Promise<number>;
  countTotal(): Promise<number>;
}
