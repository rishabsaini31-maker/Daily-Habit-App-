import { describe, it, expect } from 'vitest';
import { StreakCalculator } from '../../src/domain/services/streak-calculator.js';
import { HabitCompletion } from '../../src/domain/entities/completion.entity.js';

function createCompletion(date: string, status: 'COMPLETED' | 'SKIPPED' = 'COMPLETED', notes: string | null = null): HabitCompletion {
  return new HabitCompletion({
    id: `comp-${date}`,
    habitId: 'habit-1',
    userId: 'user-1',
    date,
    status,
    value: 1,
    notes,
    completedAt: new Date(`${date}T10:00:00Z`),
    createdAt: new Date(`${date}T10:00:00Z`),
    updatedAt: new Date(`${date}T10:00:00Z`),
  });
}

describe('StreakCalculator Domain Service', () => {
  it('calculates streak 1 when only today is completed', () => {
    const userToday = '2026-11-20';
    const completions = [createCompletion('2026-11-20')];

    const result = StreakCalculator.calculate({
      habitId: 'habit-1',
      frequencyType: 'DAILY',
      frequencyPayload: null,
      completions,
      userToday,
    });

    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.lastCompletedDate).toBe('2026-11-20');
  });

  it('calculates continuous consecutive streak over 5 days', () => {
    const userToday = '2026-11-20';
    const completions = [
      createCompletion('2026-11-16'),
      createCompletion('2026-11-17'),
      createCompletion('2026-11-18'),
      createCompletion('2026-11-19'),
      createCompletion('2026-11-20'),
    ];

    const result = StreakCalculator.calculate({
      habitId: 'habit-1',
      frequencyType: 'DAILY',
      frequencyPayload: null,
      completions,
      userToday,
    });

    expect(result.currentStreak).toBe(5);
    expect(result.longestStreak).toBe(5);
  });

  it('preserves yesterday streak when today is not yet completed', () => {
    const userToday = '2026-11-20';
    const completions = [
      createCompletion('2026-11-18'),
      createCompletion('2026-11-19'),
    ];

    const result = StreakCalculator.calculate({
      habitId: 'habit-1',
      frequencyType: 'DAILY',
      frequencyPayload: null,
      completions,
      userToday,
    });

    expect(result.currentStreak).toBe(2);
    expect(result.lastCompletedDate).toBe('2026-11-19');
  });

  it('resets streak to 0 if yesterday was missed and today is not completed', () => {
    const userToday = '2026-11-20';
    const completions = [
      createCompletion('2026-11-17'),
      createCompletion('2026-11-18'),
      // 2026-11-19 missed!
    ];

    const result = StreakCalculator.calculate({
      habitId: 'habit-1',
      frequencyType: 'DAILY',
      frequencyPayload: null,
      completions,
      userToday,
    });

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(2);
  });

  it('preserves streak across off-days for WEEKLY_DAYS habits (Mon, Wed, Fri)', () => {
    // 2026-11-16 is Monday (day 1)
    // 2026-11-17 is Tuesday (day 2 - off day)
    // 2026-11-18 is Wednesday (day 3)
    // 2026-11-19 is Thursday (day 4 - off day)
    // 2026-11-20 is Friday (day 5)
    const userToday = '2026-11-20';
    const completions = [
      createCompletion('2026-11-16'),
      createCompletion('2026-11-18'),
      createCompletion('2026-11-20'),
    ];

    const result = StreakCalculator.calculate({
      habitId: 'habit-mwf',
      frequencyType: 'WEEKLY_DAYS',
      frequencyPayload: [1, 3, 5],
      completions,
      userToday,
    });

    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('preserves streak when a missed scheduled day was frozen', () => {
    const userToday = '2026-11-20';
    const completions = [
      createCompletion('2026-11-18'),
      createCompletion('2026-11-19', 'SKIPPED', 'STREAK_FREEZE'),
      createCompletion('2026-11-20'),
    ];

    const result = StreakCalculator.calculate({
      habitId: 'habit-1',
      frequencyType: 'DAILY',
      frequencyPayload: null,
      completions,
      userToday,
    });

    expect(result.currentStreak).toBe(2);
  });
});
