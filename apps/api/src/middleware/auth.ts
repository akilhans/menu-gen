import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { HttpError } from '../utils/httpError';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
    userEmail?: string;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(HttpError.unauthorized('Missing bearer token'));
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.userId = payload.sub;
    req.userEmail = payload.email;
    next();
  } catch {
    next(HttpError.unauthorized('Invalid or expired token'));
  }
}
