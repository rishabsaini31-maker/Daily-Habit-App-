/**
 * Pure Domain Value Object: FrequencyType
 * Zero external dependencies.
 */
export type FrequencyType = 'DAILY' | 'WEEKLY_DAYS' | 'TIMES_PER_PERIOD';

export class FrequencyTypeVo {
  private static readonly VALID_TYPES: FrequencyType[] = [
    'DAILY',
    'WEEKLY_DAYS',
    'TIMES_PER_PERIOD',
  ];

  public static isValid(value: unknown): value is FrequencyType {
    return typeof value === 'string' && FrequencyTypeVo.VALID_TYPES.includes(value as FrequencyType);
  }
}
