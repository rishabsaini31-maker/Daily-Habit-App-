import { HabitCompletion } from '../../domain/entities/completion.entity.js';

export interface CompletionFilterOptions {
  startDate?: string;
  endDate?: string;
}

export interface ICompletionRepository {
  findById(id: string): Promise<HabitCompletion | null>;
  findByHabitAndDate(habitId: string, date: string): Promise<HabitCompletion | null>;
  findByHabitId(habitId: string, options?: CompletionFilterOptions): Promise<HabitCompletion[]>;
  findByUserIdAndDateRange(userId: string, startDate: string, endDate: string): Promise<HabitCompletion[]>;
  save(completion: HabitCompletion): Promise<void>;
  delete(habitId: string, date: string): Promise<boolean>;
  countCompletionsToday(dateString: string): Promise<number>;
  countTotalCompletions(userId?: string): Promise<number>;
}
