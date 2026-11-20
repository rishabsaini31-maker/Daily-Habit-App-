import { describe, it, expect } from 'vitest';
import { FrequencyEvaluator } from '../../src/domain/services/frequency-evaluator.js';

describe('FrequencyEvaluator Domain Service', () => {
  it('identifies every date as scheduled for DAILY frequency', () => {
    expect(FrequencyEvaluator.isScheduledDay('DAILY', null, '2026-11-20')).toBe(true);
    expect(FrequencyEvaluator.isScheduledDay('DAILY', null, '2026-11-21')).toBe(true);
    expect(FrequencyEvaluator.isScheduledDay('DAILY', null, '2026-11-22')).toBe(true);
  });

  it('correctly filters days for WEEKLY_DAYS frequency (Mon, Wed, Fri = [1, 3, 5])', () => {
    // 2026-11-15 is Sunday (0)
    // 2026-11-16 is Monday (1)
    // 2026-11-17 is Tuesday (2)
    // 2026-11-18 is Wednesday (3)
    // 2026-11-19 is Thursday (4)
    // 2026-11-20 is Friday (5)
    // 2026-11-21 is Saturday (6)
    const mwf = [1, 3, 5];

    expect(FrequencyEvaluator.isScheduledDay('WEEKLY_DAYS', mwf, '2026-11-15')).toBe(false);
    expect(FrequencyEvaluator.isScheduledDay('WEEKLY_DAYS', mwf, '2026-11-16')).toBe(true);
    expect(FrequencyEvaluator.isScheduledDay('WEEKLY_DAYS', mwf, '2026-11-17')).toBe(false);
    expect(FrequencyEvaluator.isScheduledDay('WEEKLY_DAYS', mwf, '2026-11-18')).toBe(true);
    expect(FrequencyEvaluator.isScheduledDay('WEEKLY_DAYS', mwf, '2026-11-19')).toBe(false);
    expect(FrequencyEvaluator.isScheduledDay('WEEKLY_DAYS', mwf, '2026-11-20')).toBe(true);
    expect(FrequencyEvaluator.isScheduledDay('WEEKLY_DAYS', mwf, '2026-11-21')).toBe(false);
  });
});
