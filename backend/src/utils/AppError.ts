// Distinguishes "expected" operational errors (bad input, not found, unauthorized)
// from unexpected bugs. The error handler uses this flag to decide whether it's
// safe to show the message to the client.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Not authorized") {
    super(message, 401);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super(message, 422);
  }
}
