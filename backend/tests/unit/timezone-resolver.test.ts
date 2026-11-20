import { describe, it, expect } from 'vitest';
import { TimezoneResolver } from '../../src/domain/services/timezone-resolver.js';

describe('TimezoneResolver Domain Service', () => {
  it('permits check-ins for today', () => {
    const today = '2026-11-20';
    const res = TimezoneResolver.isWithinBackfillWindow(today, today, 2);
    expect(res.valid).toBe(true);
  });

  it('permits check-ins within 48h (yesterday and 2 days ago)', () => {
    const today = '2026-11-20';
    expect(TimezoneResolver.isWithinBackfillWindow('2026-11-19', today, 2).valid).toBe(true);
    expect(TimezoneResolver.isWithinBackfillWindow('2026-11-18', today, 2).valid).toBe(true);
  });

  it('rejects completions older than 48 hours (3 days ago)', () => {
    const today = '2026-11-20';
    const res = TimezoneResolver.isWithinBackfillWindow('2026-11-17', today, 2);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('backfilled');
  });

  it('rejects future completion dates', () => {
    const today = '2026-11-20';
    const res = TimezoneResolver.isWithinBackfillWindow('2026-11-21', today, 2);
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('future');
  });
});
