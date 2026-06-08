import { Router } from 'express';
import {
  getCards, getCard, assignCard, updateCard, deleteCard, lookupCard,
} from '../controllers/rfidController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getCards);
router.get('/:id', authenticate, getCard);
router.post('/', authenticate, assignCard);
router.put('/:id', authenticate, updateCard);
router.delete('/:id', authenticate, deleteCard);
router.get('/lookup/:uid', authenticate, lookupCard);

export default router;
