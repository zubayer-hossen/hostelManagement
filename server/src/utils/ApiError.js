export class ApiError extends Error {
  constructor(statusCode, message, { errors = [], code } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(message = 'Bad request', opts) { return new ApiError(400, message, opts); }
  static unauthorized(message = 'Authentication required', opts) { return new ApiError(401, message, opts); }
  static forbidden(message = 'You do not have permission to perform this action', opts) { return new ApiError(403, message, opts); }
  static notFound(message = 'Resource not found', opts) { return new ApiError(404, message, opts); }
  static conflict(message = 'Conflict', opts) { return new ApiError(409, message, opts); }
  static tooMany(message = 'Too many requests', opts) { return new ApiError(429, message, opts); }
}
