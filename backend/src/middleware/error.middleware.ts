import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../domain/errors/domain.error.js';
import { v4 as uuidv4 } from 'uuid';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = req.requestId || (req.headers['x-request-id'] as string) || `req-${uuidv4().slice(0, 8)}`;
  const timestamp = new Date().toISOString();

  if (err instanceof DomainError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp,
        requestId,
      },
    });
  }

  // Fallback for unhandled internal errors
  console.error('[UnhandledError]', err);
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected internal server error occurred.' : err.message,
      details: null,
      timestamp,
      requestId,
    },
  });
}
