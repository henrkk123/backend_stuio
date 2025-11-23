import { Router } from 'express';
import { handleGenerate } from '../controllers/generateController.js';

const router = Router();

router.post('/generate', handleGenerate);

export default router;
