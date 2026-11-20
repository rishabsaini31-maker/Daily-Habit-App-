import { DateString } from '../value-objects/date-string.vo.js';

export class TimezoneResolver {
  /**
   * Resolves the current local date (YYYY-MM-DD) in the specified IANA timezone.
   */
  public static getLocalDate(timezone: string = 'UTC', baseDate: Date = new Date()): string {
    return DateString.today(timezone);
  }

  /**
   * Validates whether a target date is within the allowable 48-hour backfill window.
   * Window rule: userToday - 2 days <= targetDate <= userToday
   */
  public static isWithinBackfillWindow(
    targetDate: string,
    userToday: string,
    maxDaysBack: number = 2
  ): { valid: boolean; reason?: string } {
    if (!DateString.isValid(targetDate)) {
      return { valid: false, reason: 'Invalid date format. Expected YYYY-MM-DD.' };
    }

    if (DateString.isAfter(targetDate, userToday)) {
      return { valid: false, reason: 'Completions cannot be recorded for future dates.' };
    }

    const diffDays = DateString.daysBetween(targetDate, userToday);
    if (diffDays > maxDaysBack) {
      return {
        valid: false,
        reason: `Completions cannot be backfilled beyond ${maxDaysBack * 24} hours (${maxDaysBack} days) in the past.`,
      };
    }

    return { valid: true };
  }
}
