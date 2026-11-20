export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 400,
    public readonly details: unknown = null
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_FAILED', message, 400, details);
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'Authentication required.') {
    super('AUTH_UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'Access denied.') {
    super('AUTH_FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string = 'Resource not found.') {
    super('RESOURCE_NOT_FOUND', message, 404);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string = 'Resource conflict.') {
    super('IDEMPOTENCY_CONFLICT', message, 409);
  }
}

export class AccountSuspendedError extends DomainError {
  constructor(message: string = 'Account has been suspended.') {
    super('AUTH_ACCOUNT_SUSPENDED', message, 403);
  }
}

export class CompletionWindowExceededError extends DomainError {
  constructor(message: string = 'Completion backfill window exceeded.') {
    super('COMPLETION_WINDOW_EXCEEDED', message, 400);
  }
}
