import { Router } from 'express';
import { handleAssistantQuestion } from '../controllers/assistantController.js';
import { requireAdmin } from '../middlewares/auth.js';

const router = Router();

// KI-Assistent im Admin-Studio
router.use(requireAdmin);
router.post('/assistant', handleAssistantQuestion);

export default router;

