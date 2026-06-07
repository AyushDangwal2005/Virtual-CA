export class AppError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', 400, message, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super('AUTHENTICATION_ERROR', 401, message);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super('NOT_FOUND_ERROR', 404, message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', public retryAfter?: number) {
    super('RATE_LIMIT_ERROR', 429, message);
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(
    public service: string,
    message: string,
    statusCode: number = 502,
    details?: Record<string, any>
  ) {
    super('EXTERNAL_SERVICE_ERROR', statusCode, `${service} error: ${message}`, details);
    this.name = 'ExternalServiceError';
  }
}

export class TimeoutError extends AppError {
  constructor(message: string = 'Request timeout') {
    super('TIMEOUT_ERROR', 504, message);
    this.name = 'TimeoutError';
  }
}

/**
 * Handle errors and return standardized response
 */
export function handleError(error: unknown): {
  code: string;
  statusCode: number;
  message: string;
  details?: Record<string, any>;
} {
  if (error instanceof AppError) {
    return {
      code: error.code,
      statusCode: error.statusCode,
      message: error.message,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
      message: error.message,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
    message: 'An unexpected error occurred',
  };
}
