import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../domain/errors/domain.error.js';

export function requireRole(role: 'ADMIN' | 'USER') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    if (role === 'ADMIN' && req.user.role !== 'ADMIN') {
      return next(new ForbiddenError('Administrative access privileges required.'));
    }

    next();
  };
}
