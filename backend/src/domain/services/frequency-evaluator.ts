import { DateString } from '../value-objects/date-string.vo.js';
import { FrequencyType } from '../value-objects/frequency-type.vo.js';

export class FrequencyEvaluator {
  /**
   * Determines if a specific date (YYYY-MM-DD) is an active scheduled day for the habit.
   */
  public static isScheduledDay(
    frequencyType: FrequencyType,
    frequencyPayload: number[] | null,
    dateStr: string
  ): boolean {
    if (frequencyType === 'DAILY') {
      return true;
    }

    if (frequencyType === 'WEEKLY_DAYS') {
      if (!frequencyPayload || frequencyPayload.length === 0) {
        return true; // Default to daily if no days specified
      }
      const dayOfWeek = DateString.getDayOfWeek(dateStr); // 0=Sun, 1=Mon, ..., 6=Sat
      return frequencyPayload.includes(dayOfWeek);
    }

    if (frequencyType === 'TIMES_PER_PERIOD') {
      // In TIMES_PER_PERIOD, any day can potentially be an active completion day
      return true;
    }

    return true;
  }
}
