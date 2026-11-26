import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

import { ERROR_CODE, HttpError } from '@/lib/http-error';
import { logger } from '@/lib/logger';

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(HttpError.notFound('This endpoint does not exist'));
};

function isBodyParserError(error: unknown): error is { status: number; type: string } {
  return typeof error === 'object' && error !== null && 'type' in error && 'status' in error;
}

function toHttpError(error: unknown): HttpError {
  if (error instanceof HttpError) {
    return error;
  }

  if (error instanceof ZodError) {
    const details = error.issues.map(({ path, message }) => ({ field: path.join('.'), message }));
    return new HttpError(400, ERROR_CODE.VALIDATION_FAILED, 'Some details are not valid', details);
  }

  if (isBodyParserError(error)) {
    if (error.type === 'entity.too.large') {
      return new HttpError(413, ERROR_CODE.PAYLOAD_TOO_LARGE, 'The request is too large');
    }
    return new HttpError(400, ERROR_CODE.BAD_REQUEST, 'The request could not be read');
  }

  return new HttpError(500, ERROR_CODE.INTERNAL, 'Something went wrong on our side');
}

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const httpError = toHttpError(error);

  if (httpError.status >= 500) {
    logger.error({ err: error, path: req.path }, 'Unhandled request error');
  }

  res.status(httpError.status).json({
    error: {
      code: httpError.code,
      message: httpError.message,
      ...(httpError.details ? { details: httpError.details } : {}),
    },
  });
};
