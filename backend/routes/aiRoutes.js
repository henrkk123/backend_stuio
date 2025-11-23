import { Router } from 'express';
import { handleAiTask } from '../controllers/aiController.js';

const router = Router();

router.post('/ai', handleAiTask);

export default router;
