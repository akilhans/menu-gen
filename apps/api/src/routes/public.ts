import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../utils/asyncHandler';
import { getPublicMenu } from '../controllers/publicController';
import { createOrder, createOrderSchema } from '../controllers/orderController';
import { validateBody } from '../middleware/validate';

const router = Router();

const orderLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/menu/:slug', asyncHandler(getPublicMenu));
router.post(
  '/orders',
  orderLimiter,
  validateBody(createOrderSchema),
  asyncHandler(createOrder)
);

export default router;
