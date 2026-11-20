import { IHabitRepository } from '../ports/habit.repository.port.js';
import { ICompletionRepository } from '../ports/completion.repository.port.js';
import { IStreakRepository } from '../ports/streak.repository.port.js';
import { IUserRepository } from '../ports/user.repository.port.js';
import { IClockService } from '../ports/clock.service.port.js';
import { DateString } from '../../domain/value-objects/date-string.vo.js';
import { FrequencyEvaluator } from '../../domain/services/frequency-evaluator.js';

export class GetAnalyticsSummaryUseCase {
  constructor(
    private readonly habitRepo: IHabitRepository,
    private readonly completionRepo: ICompletionRepository,
    private readonly streakRepo: IStreakRepository,
    private readonly userRepo: IUserRepository,
    private readonly clockService: IClockService
  ) {}

  public async execute(userId: string) {
    const user = await this.userRepo.findById(userId);
    const timezone = user?.timezone || 'UTC';
    const today = this.clockService.today(timezone);

    const activeHabits = await this.habitRepo.findByUserId(userId, { isArchived: false });
    const totalCompletions = await this.completionRepo.countTotalCompletions(userId);
    const longestOverallStreak = await this.streakRepo.findLongestOverall(userId);

    // Calculate 7-day completion rate
    const date7dStart = DateString.addDays(today, -6);
    const completions7d = await this.completionRepo.findByUserIdAndDateRange(
      userId,
      date7dStart,
      today
    );
    const completedSet7d = new Set(
      completions7d.filter((c) => c.isCompleted()).map((c) => `${c.habitId}_${c.date}`)
    );

    let scheduled7dCount = 0;
    let completed7dCount = 0;

    for (let i = 0; i < 7; i++) {
      const d = DateString.addDays(date7dStart, i);
      for (const h of activeHabits) {
        if (FrequencyEvaluator.isScheduledDay(h.frequencyType, h.frequencyPayload, d)) {
          scheduled7dCount++;
          if (completedSet7d.has(`${h.id}_${d}`)) {
            completed7dCount++;
          }
        }
      }
    }

    const completionRate7d =
      scheduled7dCount > 0 ? Number(((completed7dCount / scheduled7dCount) * 100).toFixed(1)) : 0;

    // Calculate 30-day completion rate
    const date30dStart = DateString.addDays(today, -29);
    const completions30d = await this.completionRepo.findByUserIdAndDateRange(
      userId,
      date30dStart,
      today
    );
    const completedSet30d = new Set(
      completions30d.filter((c) => c.isCompleted()).map((c) => `${c.habitId}_${c.date}`)
    );

    let scheduled30dCount = 0;
    let completed30dCount = 0;

    for (let i = 0; i < 30; i++) {
      const d = DateString.addDays(date30dStart, i);
      for (const h of activeHabits) {
        if (FrequencyEvaluator.isScheduledDay(h.frequencyType, h.frequencyPayload, d)) {
          scheduled30dCount++;
          if (completedSet30d.has(`${h.id}_${d}`)) {
            completed30dCount++;
          }
        }
      }
    }

    const completionRate30d =
      scheduled30dCount > 0 ? Number(((completed30dCount / scheduled30dCount) * 100).toFixed(1)) : 0;

    // Milestones calculation based on longestOverallStreak
    const milestoneThresholds = [
      { days: 3, id: '3_DAY_STREAK' },
      { days: 7, id: '7_DAY_STREAK' },
      { days: 14, id: '14_DAY_STREAK' },
      { days: 30, id: '30_DAY_STREAK' },
      { days: 60, id: '60_DAY_STREAK' },
      { days: 100, id: '100_DAY_STREAK' },
      { days: 365, id: '365_DAY_STREAK' },
    ];

    const milestonesEarned = milestoneThresholds
      .filter((m) => longestOverallStreak >= m.days)
      .map((m) => m.id);

    return {
      completionRate7d,
      completionRate30d,
      totalCompletions,
      activeHabitsCount: activeHabits.length,
      longestOverallStreak,
      milestonesEarned,
    };
  }
}
