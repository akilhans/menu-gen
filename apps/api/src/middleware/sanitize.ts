import { Request, Response, NextFunction } from 'express';

/**
 * Strips keys that begin with `$` or contain `.` from `req.body` and `req.query`.
 * This blocks NoSQL operator injection (e.g. `{ "email": { "$gt": "" } }`)
 * before any controller sees the input.
 *
 * Zod schemas already coerce expected types, so this is defense-in-depth — but
 * it's cheap and catches misuse on routes that haven't been migrated yet.
 *
 * Time:  O(K) where K is number of keys (recursive).
 * Space: O(1) extra (mutates in place).
 */
function clean(value: unknown): void {
  if (value == null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) clean(item);
    return;
  }
  const obj = value as Record<string, unknown>;
  for (const k of Object.keys(obj)) {
    if (k.startsWith('$') || k.includes('.')) {
      delete obj[k];
      continue;
    }
    clean(obj[k]);
  }
}

export function mongoSanitize(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') clean(req.body);
  if (req.query && typeof req.query === 'object') clean(req.query as Record<string, unknown>);
  if (req.params && typeof req.params === 'object') clean(req.params as Record<string, unknown>);
  next();
}
