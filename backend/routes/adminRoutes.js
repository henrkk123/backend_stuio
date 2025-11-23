import { Router } from 'express';
import { loginAdmin } from '../controllers/adminController.js';

const router = Router();

// POST /api/admin/login → prüft den Admin-Token aus .env
router.post('/admin/login', loginAdmin);

export default router;

