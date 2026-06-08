import { Router } from 'express';
import {
  getDevices, getDevice, createDevice, updateDevice, deleteDevice, heartbeat,
} from '../controllers/deviceController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getDevices);
router.get('/:id', authenticate, getDevice);
router.post('/', authenticate, createDevice);
router.put('/:id', authenticate, updateDevice);
router.delete('/:id', authenticate, deleteDevice);
router.post('/heartbeat', heartbeat);

export default router;
