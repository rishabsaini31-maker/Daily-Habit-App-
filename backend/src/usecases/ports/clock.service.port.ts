export interface IClockService {
  now(): Date;
  today(timezone?: string): string;
}
