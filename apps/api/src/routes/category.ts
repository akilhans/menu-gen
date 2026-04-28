import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
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
router.patch('/:id', validateBody(updateCategorySchema), asyncHandler(updateCategory));
router.delete('/:id', asyncHandler(deleteCategory));

export default router;
