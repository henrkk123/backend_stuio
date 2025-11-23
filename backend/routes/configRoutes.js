import { Router } from 'express';
import { getConfig, saveConfig, exportSnippet, exportZip } from '../controllers/configController.js';
import { requireAdmin } from '../middlewares/auth.js';

const router = Router();

// All config & export endpoints are protected by the ADMIN_TOKEN (if set).
router.use(requireAdmin);

router.get('/config/:id', getConfig);
router.post('/config/:id', saveConfig);
router.get('/export-snippet/:id', exportSnippet);
router.get('/export-zip/:id', exportZip);

export default router;
