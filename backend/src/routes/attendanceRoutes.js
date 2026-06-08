import { Router } from 'express';
import {
  scanCard, getAttendance, getTodayAttendance, getAttendanceStats, getAttendanceByDate,
} from '../controllers/attendanceController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/scan', authenticate, scanCard);
router.get('/', authenticate, getAttendance);
router.get('/today', authenticate, getTodayAttendance);
router.get('/stats', authenticate, getAttendanceStats);
router.get('/date/:date', authenticate, getAttendanceByDate);

export default router;
