import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { getQrInfo, getQrPng, getQrSvg } from '../controllers/qrController';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(getQrInfo));
router.get('/download.png', asyncHandler(getQrPng));
router.get('/download.svg', asyncHandler(getQrSvg));

export default router;
