import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { HttpError } from '../utils/httpError';

/**
 * Returns a middleware that 404s on routes whose `:paramName` is not a valid
 * Mongo ObjectId. Without this, an invalid id flows into Mongoose, throws
 * `CastError`, and (in non-prod) leaks the raw error message to the client.
 *
 * Example:
 *   router.patch('/:id', requireObjectId('id'), validateBody(...), handler);
 */
export function requireObjectId(paramName: string = 'id') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const value = req.params[paramName];
    if (!value || !Types.ObjectId.isValid(value)) {
      return next(HttpError.notFound('Not found'));
    }
    next();
  };
}
