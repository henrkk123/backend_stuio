const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

// Optional API key guard – currently not used by the admin UI.
export function requireApiKey(req, res, next) {
  if (req.path === '/health') return next();
  const apiKey = process.env.API_KEY;
  if (!apiKey) return next();
  const provided = req.header('x-api-key') || req.header('authorization')?.replace('ApiKey ', '');
  if (provided !== apiKey) return res.status(401).json({ error: 'Invalid API key' });
  next();
}

// Helper to validate the shared ADMIN_TOKEN from .env
export function verifyAdminToken(token) {
  if (!ADMIN_TOKEN) return true; // no token configured → admin check disabled
  return token === ADMIN_TOKEN;
}

// Guard for protected admin routes (config, export, etc.).
export function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) return next();
  const provided =
    req.header('x-admin-token') ||
    (req.header('authorization') || '').replace('Bearer ', '');
  if (!verifyAdminToken(provided)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
