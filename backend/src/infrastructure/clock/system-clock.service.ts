import { IClockService } from '../../usecases/ports/clock.service.port.js';
import { DateString } from '../../domain/value-objects/date-string.vo.js';

export class SystemClockService implements IClockService {
  public now(): Date {
    return new Date();
  }

  public today(timezone: string = 'UTC'): string {
    return DateString.today(timezone);
  }
}
