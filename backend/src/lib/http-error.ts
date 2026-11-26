export const ERROR_CODE = {
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',
} as const;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'HttpError';
  }

  static unauthenticated(message = 'Please sign in to continue') {
    return new HttpError(401, ERROR_CODE.UNAUTHENTICATED, message);
  }

  static forbidden(message = 'You do not have access to this') {
    return new HttpError(403, ERROR_CODE.FORBIDDEN, message);
  }

  static notFound(message = 'Not found') {
    return new HttpError(404, ERROR_CODE.NOT_FOUND, message);
  }

  static conflict(message: string) {
    return new HttpError(409, ERROR_CODE.CONFLICT, message);
  }
}
