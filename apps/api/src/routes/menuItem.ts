import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import {
  createItem,
  createItemSchema,
  deleteItem,
  listItems,
  updateItem,
  updateItemSchema,
} from '../controllers/menuItemController';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(listItems));
router.post('/', validateBody(createItemSchema), asyncHandler(createItem));
router.patch('/:id', validateBody(updateItemSchema), asyncHandler(updateItem));
router.delete('/:id', asyncHandler(deleteItem));

export default router;
