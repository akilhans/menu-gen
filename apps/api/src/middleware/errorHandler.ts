import { ErrorRequestHandler } from 'express';
import { HttpError } from '../utils/httpError';
import { ZodError } from 'zod';
import { MulterError } from 'multer';
import { isProd } from '../config/env';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.flatten(),
    });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.message,
      code: err.code,
      details: err.details,
    });
  }

  if (err instanceof MulterError) {
    const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({
      message: err.message,
      code: err.code,
    });
  }

  // Mongo duplicate
  if (err?.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate key',
      code: 'DUPLICATE',
      details: err.keyValue,
    });
  }

  // eslint-disable-next-line no-console
  console.error('[unhandled]', err);
  res.status(500).json({
    message: isProd ? 'Internal server error' : err?.message ?? 'Internal server error',
  });
};
