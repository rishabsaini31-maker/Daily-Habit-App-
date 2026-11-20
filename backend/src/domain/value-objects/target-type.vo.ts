/**
 * Pure Domain Value Object: TargetType
 * Zero external dependencies.
 */
export type TargetType = 'BOOLEAN' | 'NUMERIC';

export class TargetTypeVo {
  private static readonly VALID_TYPES: TargetType[] = ['BOOLEAN', 'NUMERIC'];

  public static isValid(value: unknown): value is TargetType {
    return typeof value === 'string' && TargetTypeVo.VALID_TYPES.includes(value as TargetType);
  }
}
