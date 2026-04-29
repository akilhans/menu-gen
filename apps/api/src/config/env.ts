import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const DEFAULT_DEV_SECRET = 'dev-secret-change-me';

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProdEnv = nodeEnv === 'production';

const jwtSecret = process.env.JWT_SECRET ?? (isProdEnv ? '' : DEFAULT_DEV_SECRET);
if (!jwtSecret || (isProdEnv && jwtSecret === DEFAULT_DEV_SECRET)) {
  throw new Error(
    'JWT_SECRET is required in production. Generate with `openssl rand -hex 48`.'
  );
}
if (jwtSecret.length < 32 && isProdEnv) {
  throw new Error(
    'JWT_SECRET must be at least 32 characters in production for HS256 to be safe.'
  );
}

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 4000),
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/menu-gen'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  publicWebUrl: process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000',
};

export const isProd = isProdEnv;
