import { Router } from 'express';
import {
  getStudents, getStudent, createStudent, updateStudent, deleteStudent,
} from '../controllers/studentController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getStudents);
router.get('/:id', authenticate, getStudent);
router.post('/', authenticate, createStudent);
router.put('/:id', authenticate, updateStudent);
router.delete('/:id', authenticate, deleteStudent);

export default router;
