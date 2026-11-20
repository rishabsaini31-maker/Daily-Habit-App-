/**
 * Pure Domain Value Object: DateString
 * Format: YYYY-MM-DD
 * Zero external dependencies.
 */
export class DateString {
  private static readonly REGEX = /^\d{4}-\d{2}-\d{2}$/;

  public static isValid(value: string): boolean {
    if (!DateString.REGEX.test(value)) {
      return false;
    }
    const [y, m, d] = value.split('-').map(Number);
    if (m < 1 || m > 12) return false;
    if (d < 1 || d > 31) return false;
    const date = new Date(Date.UTC(y, m - 1, d));
    return (
      date.getUTCFullYear() === y &&
      date.getUTCMonth() === m - 1 &&
      date.getUTCDate() === d
    );
  }

  public static today(timezone: string = 'UTC'): string {
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(new Date());
    } catch {
      return new Date().toISOString().slice(0, 10);
    }
  }

  public static addDays(dateStr: string, days: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  public static daysBetween(d1: string, d2: string): number {
    const [y1, m1, day1] = d1.split('-').map(Number);
    const [y2, m2, day2] = d2.split('-').map(Number);
    const t1 = Date.UTC(y1, m1 - 1, day1);
    const t2 = Date.UTC(y2, m2 - 1, day2);
    return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
  }

  public static getDayOfWeek(dateStr: string): number {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return date.getUTCDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  }

  public static isBefore(d1: string, d2: string): boolean {
    return d1 < d2;
  }

  public static isAfter(d1: string, d2: string): boolean {
    return d1 > d2;
  }
}
