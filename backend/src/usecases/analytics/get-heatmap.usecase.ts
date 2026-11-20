import { IHabitRepository } from '../ports/habit.repository.port.js';
import { ICompletionRepository } from '../ports/completion.repository.port.js';
import { IUserRepository } from '../ports/user.repository.port.js';
import { IClockService } from '../ports/clock.service.port.js';
import { FrequencyEvaluator } from '../../domain/services/frequency-evaluator.js';

export class GetHeatmapUseCase {
  constructor(
    private readonly habitRepo: IHabitRepository,
    private readonly completionRepo: ICompletionRepository,
    private readonly userRepo: IUserRepository,
    private readonly clockService: IClockService
  ) {}

  public async execute(userId: string, monthParam?: string) {
    const user = await this.userRepo.findById(userId);
    const timezone = user?.timezone || 'UTC';
    const today = this.clockService.today(timezone);

    // Default to current month YYYY-MM if not specified
    const targetMonth = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : today.slice(0, 7);

    const [year, month] = targetMonth.split('-').map(Number);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

    const startDate = `${targetMonth}-01`;
    const endDate = `${targetMonth}-${String(daysInMonth).padStart(2, '0')}`;

    const activeHabits = await this.habitRepo.findByUserId(userId, { isArchived: false });
    const completions = await this.completionRepo.findByUserIdAndDateRange(
      userId,
      startDate,
      endDate
    );

    const completionSet = new Set(
      completions.filter((c) => c.isCompleted()).map((c) => `${c.habitId}_${c.date}`)
    );

    const heatmap = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${targetMonth}-${String(day).padStart(2, '0')}`;
      let totalScheduled = 0;
      let completedCount = 0;

      for (const h of activeHabits) {
        if (FrequencyEvaluator.isScheduledDay(h.frequencyType, h.frequencyPayload, dateStr)) {
          totalScheduled++;
          if (completionSet.has(`${h.id}_${dateStr}`)) {
            completedCount++;
          }
        }
      }

      const completionRatio =
        totalScheduled > 0 ? Number((completedCount / totalScheduled).toFixed(2)) : 0;

      heatmap.push({
        date: dateStr,
        totalScheduled,
        completedCount,
        completionRatio,
      });
    }

    return heatmap;
  }
}
