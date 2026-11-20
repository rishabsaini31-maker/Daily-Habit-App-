import { StreakRecord } from '../../domain/entities/streak.entity.js';

export interface IStreakRepository {
  findByHabitId(habitId: string): Promise<StreakRecord | null>;
  save(streak: StreakRecord): Promise<void>;
  update(streak: StreakRecord): Promise<void>;
  findLongestOverall(userId: string): Promise<number>;
  countActiveStreaks(userId?: string): Promise<number>;
}
