import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  getMyRestaurant,
  updateMyRestaurant,
  updateRestaurantSchema,
} from '../controllers/restaurantController';

const router = Router();

router.use(requireAuth);
router.get('/me', asyncHandler(getMyRestaurant));
router.patch('/me', validateBody(updateRestaurantSchema), asyncHandler(updateMyRestaurant));

export default router;
