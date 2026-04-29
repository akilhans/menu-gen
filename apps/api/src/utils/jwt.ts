import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  /** Mongo `_id` of the authenticated User, as a string. */
  sub: string;
  /** Lowercased email, denormalized so handlers don't need a User lookup. */
  email: string;
}

/**
 * Sign a JWT for a freshly-authenticated user.
 *
 * Algorithm: HS256 (symmetric). Expiry: `JWT_EXPIRES_IN` env (default 7d).
 *
 * Caveat: the secret is shared by the entire backend. Rotating `JWT_SECRET`
 * invalidates every existing token in one shot — useful as a kill-switch
 * after a breach.
 */
export function signToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwtSecret, options);
}

/**
 * Verify a token and return its payload. Throws `JsonWebTokenError` /
 * `TokenExpiredError` on failure — the caller (typically `requireAuth`)
 * is expected to translate that into HTTP 401.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
