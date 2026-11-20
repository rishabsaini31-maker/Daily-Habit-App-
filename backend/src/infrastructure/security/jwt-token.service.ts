import jwt from 'jsonwebtoken';
import { ITokenService, TokenPayload } from '../../usecases/ports/token.service.port.js';

export class JwtTokenService implements ITokenService {
  private readonly secret: string;

  constructor(secret?: string) {
    this.secret = secret || process.env.JWT_SECRET || 'habitpulse-super-secure-production-secret-key-2027';
  }

  public signToken(payload: TokenPayload, expiresInSeconds: number = 3600): string {
    return jwt.sign(
      {
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        timezone: payload.timezone,
      },
      this.secret,
      { expiresIn: expiresInSeconds }
    );
  }

  public verifyToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.secret) as any;
      if (!decoded || !decoded.sub) {
        return null;
      }
      return {
        sub: decoded.sub,
        email: decoded.email,
        role: decoded.role,
        timezone: decoded.timezone,
      };
    } catch {
      return null;
    }
  }
}
