import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as streakController from '../controllers/streakController';

const router = Router();

router.get('/', authenticate, streakController.checar);

export default router;
