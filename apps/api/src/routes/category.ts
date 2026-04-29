import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { requireObjectId } from '../middleware/objectId';
import {
  createCategory,
  createCategorySchema,
  deleteCategory,
  listCategories,
  updateCategory,
  updateCategorySchema,
} from '../controllers/categoryController';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(listCategories));
router.post('/', validateBody(createCategorySchema), asyncHandler(createCategory));
router.patch(
  '/:id',
  requireObjectId('id'),
  validateBody(updateCategorySchema),
  asyncHandler(updateCategory)
);
router.delete('/:id', requireObjectId('id'), asyncHandler(deleteCategory));

export default router;
