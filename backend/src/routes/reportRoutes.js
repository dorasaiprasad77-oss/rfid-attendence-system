import { Router } from 'express';
import { exportReport } from '../controllers/reportController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/export', authenticate, exportReport);

export default router;
