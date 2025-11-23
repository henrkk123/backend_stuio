import { Router } from 'express';
import { handleLlmTest } from '../controllers/llmTestController.js';
import { requireAdmin } from '../middlewares/auth.js';

const router = Router();

router.use(requireAdmin);
router.post('/llm-test', handleLlmTest);

export default router;

