import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { requireObjectId } from '../middleware/objectId';
import {
  getOrderStats,
  listOrders,
  updateOrderSchema,
  updateOrderStatus,
} from '../controllers/orderController';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(listOrders));
router.get('/stats', asyncHandler(getOrderStats));
router.patch(
  '/:id',
  requireObjectId('id'),
  validateBody(updateOrderSchema),
  asyncHandler(updateOrderStatus)
);

export default router;
