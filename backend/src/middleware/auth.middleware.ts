import { Request, Response, NextFunction } from 'express';
import { ITokenService } from '../usecases/ports/token.service.port.js';
import { IUserRepository } from '../usecases/ports/user.repository.port.js';
import { UnauthorizedError, AccountSuspendedError } from '../domain/errors/domain.error.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  timezone: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
    }
  }
}

export function createAuthMiddleware(
  tokenService: ITokenService,
  userRepo: IUserRepository
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('Missing or malformed Authorization header.');
      }

      const token = authHeader.substring(7);
      const payload = tokenService.verifyToken(token);
      if (!payload) {
        throw new UnauthorizedError('Invalid or expired access token.');
      }

      const user = await userRepo.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedError('User associated with token no longer exists.');
      }

      if (!user.isActive()) {
        throw new AccountSuspendedError('This account has been suspended.');
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        timezone: user.timezone,
      };

      next();
    } catch (err) {
      next(err);
    }
  };
}
