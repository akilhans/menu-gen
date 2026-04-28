import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env, isProd } from './config/env';
import { errorHandler } from './middleware/errorHandler';

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

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );
  app.use(
    cors({
      origin: env.corsOrigin.split(',').map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));
  if (!isProd) app.use(morgan('dev'));

  const globalLimiter = rateLimit({
    windowMs: 60_000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(globalLimiter);

  // Static uploads (served with cross-origin CORP thanks to helmet above)
  app.use(
    '/uploads',
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
