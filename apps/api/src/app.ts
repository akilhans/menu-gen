import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env, isProd } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { mongoSanitize } from './middleware/sanitize';

import authRoutes from './routes/auth';
import restaurantRoutes from './routes/restaurant';
import categoryRoutes from './routes/category';
import menuItemRoutes from './routes/menuItem';
import qrRoutes from './routes/qr';
import publicRoutes from './routes/public';
import uploadRoutes, { uploadDir } from './routes/upload';
import orderRoutes from './routes/order';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Helmet defaults are tight (`X-Content-Type-Options: nosniff`,
  // `Referrer-Policy: no-referrer`, frame-deny). We DO NOT loosen CORP
  // globally; it stays at its default `same-origin`. The /uploads route
  // overrides it per-response (see below) so other origins can render
  // images uploaded by users.
  app.use(helmet());

  app.use(
    cors({
      origin: env.corsOrigin.split(',').map((s) => s.trim()),
      // Bearer-token API — no cookies. credentials:true is unnecessary and
      // forces strict origin matching with no upside.
      credentials: false,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  // Strip $-prefixed/dotted keys from body/query/params before any controller
  // sees the input. Defense-in-depth for NoSQL operator injection.
  app.use(mongoSanitize);
  if (!isProd) app.use(morgan('dev'));

  const globalLimiter = rateLimit({
    windowMs: 60_000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(globalLimiter);

  // Static uploads. Browsers cross-origin-fetch images, so CORP must be
  // `cross-origin` *for this path only*. nosniff (from helmet defaults)
  // ensures a `.png` containing HTML cannot be parsed as a document, and
  // Content-Disposition: inline forces the browser to render rather than
  // navigate.
  app.use(
    '/uploads',
    (_req, res, next) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline');
      next();
    },
    express.static(uploadDir, {
      maxAge: '7d',
      etag: true,
      fallthrough: false,
    })
  );

  app.get('/health', (_req, res) => res.json({ ok: true, env: env.nodeEnv }));

  app.use('/api/auth', authRoutes);
  app.use('/api/restaurant', restaurantRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/items', menuItemRoutes);
  app.use('/api/qr', qrRoutes);
  app.use('/api/public', publicRoutes);
  app.use('/api/uploads', uploadRoutes);
  app.use('/api/orders', orderRoutes);

  app.use((_req, res) => res.status(404).json({ message: 'Not found' }));
  app.use(errorHandler);

  return app;
}
