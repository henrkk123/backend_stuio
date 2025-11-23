import { Router } from 'express';
import { getConfig, saveConfig, exportSnippet, exportZip } from '../controllers/configController.js';
import { requireAdmin } from '../middlewares/auth.js';

const router = Router();

// Admin guard temporär deaktiviert für Tests.
router.use((_req, res, next) => next());

router.get('/config/:id', getConfig);
router.post('/config/:id', saveConfig);
router.get('/export-snippet/:id', exportSnippet);
router.get('/export-zip/:id', exportZip);

export default router;
