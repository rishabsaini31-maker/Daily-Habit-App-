import { HabitCompletion } from '../entities/completion.entity.js';
import { FrequencyType } from '../value-objects/frequency-type.vo.js';
import { DateString } from '../value-objects/date-string.vo.js';
import { FrequencyEvaluator } from './frequency-evaluator.js';

export interface StreakCalculationInput {
  habitId: string;
  frequencyType: FrequencyType;
  frequencyPayload: number[] | null;
  completions: HabitCompletion[];
  userToday: string; // YYYY-MM-DD
  existingLongestStreak?: number;
  freezeCountRemaining?: number;
}

export interface StreakCalculationResult {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  freezeCountRemaining: number;
}

export class StreakCalculator {
  /**
   * Pure deterministic calculation of habit streak state.
   */
  public static calculate(input: StreakCalculationInput): StreakCalculationResult {
    const {
      frequencyType,
      frequencyPayload,
      completions,
      userToday,
      existingLongestStreak = 0,
      freezeCountRemaining = 1,
    } = input;

    // Create a fast lookup map of completions by date
    const completionMap = new Map<string, HabitCompletion>();
    for (const c of completions) {
      completionMap.set(c.date, c);
    }

    let currentStreak = 0;
    let lastCompletedDate: string | null = null;

    // Check today
    let checkDate = userToday;
    const isTodayScheduled = FrequencyEvaluator.isScheduledDay(
      frequencyType,
      frequencyPayload,
      checkDate
    );

    const todayCompletion = completionMap.get(checkDate);
    const todayCompleted = todayCompletion?.isCompleted() ?? false;

    if (todayCompleted) {
      currentStreak = 1;
      lastCompletedDate = checkDate;
      // Continue checking backward from yesterday
      checkDate = DateString.addDays(checkDate, -1);
    } else {
      // Today is not completed.
      // If today is scheduled but ongoing, streak from yesterday holds intact.
      // Move checkDate to yesterday.
      checkDate = DateString.addDays(checkDate, -1);
    }

    // Step backwards up to 365 days or until streak breaks
    let scanDays = 0;
    const MAX_SCAN_DAYS = 730;

    while (scanDays < MAX_SCAN_DAYS) {
      scanDays++;
      const isScheduled = FrequencyEvaluator.isScheduledDay(
        frequencyType,
        frequencyPayload,
        checkDate
      );

      if (!isScheduled) {
        // Off day: streak is preserved, neither incremented nor broken
        checkDate = DateString.addDays(checkDate, -1);
        continue;
      }

      // Scheduled day
      const completion = completionMap.get(checkDate);
      if (completion && completion.isCompleted()) {
        currentStreak++;
        if (!lastCompletedDate) {
          lastCompletedDate = checkDate;
        }
        checkDate = DateString.addDays(checkDate, -1);
      } else if (
        completion &&
        (completion.status === 'SKIPPED' || completion.notes?.includes('FREEZE'))
      ) {
        // Frozen or excused scheduled day: streak holds intact without incrementing
        checkDate = DateString.addDays(checkDate, -1);
      } else {
        // Missed scheduled day: streak ends
        break;
      }
    }

    // Calculate all-time longest streak from full completion history
    const computedLongest = StreakCalculator.computeAllTimeLongest(
      frequencyType,
      frequencyPayload,
      completions
    );

    const longestStreak = Math.max(existingLongestStreak, currentStreak, computedLongest);

    return {
      currentStreak,
      longestStreak,
      lastCompletedDate,
      freezeCountRemaining,
    };
  }

  /**
   * Computes the maximum continuous completed sequence across entire completion history.
   */
  private static computeAllTimeLongest(
    frequencyType: FrequencyType,
    frequencyPayload: number[] | null,
    completions: HabitCompletion[]
  ): number {
    const completedDates = completions
      .filter((c) => c.isCompleted())
      .map((c) => c.date)
      .sort();

    if (completedDates.length === 0) {
      return 0;
    }

    const completedSet = new Set(completedDates);
    const earliestDate = completedDates[0];
    const latestDate = completedDates[completedDates.length - 1];

    let maxStreak = 0;
    let runningStreak = 0;
    let curr = earliestDate;

    while (!DateString.isAfter(curr, latestDate)) {
      const isScheduled = FrequencyEvaluator.isScheduledDay(
        frequencyType,
        frequencyPayload,
        curr
      );

      if (isScheduled) {
        if (completedSet.has(curr)) {
          runningStreak++;
          if (runningStreak > maxStreak) {
            maxStreak = runningStreak;
          }
        } else {
          runningStreak = 0;
        }
      }
      curr = DateString.addDays(curr, 1);
    }

    return maxStreak;
  }
}
