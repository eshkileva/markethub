export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(422, message, 'VALIDATION_ERROR');
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor(message = 'Подтвердите email, чтобы продолжить') {
    super(403, message, 'EMAIL_NOT_VERIFIED');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string) {
    super(429, message, 'RATE_LIMIT');
  }
}
