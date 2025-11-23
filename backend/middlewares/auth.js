const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const AUTH_SECRET = process.env.AUTH_SECRET || 'change-me-secret';
import { verify } from '../utils/jwt.js';

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
  if (!ADMIN_TOKEN) return false;
  return token === ADMIN_TOKEN;
}

export function requireUser(req, res, next) {
  const bearer = (req.header('authorization') || '').replace('Bearer ', '');
  const token = bearer || req.header('x-admin-token');
  const payload = verify(token, AUTH_SECRET);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = payload;
  next();
}

// Guard for protected admin routes (config, export, etc.).
export function requireAdmin(req, res, next) {
  // Accept either ADMIN_TOKEN (legacy) or signed user token.
  const bearer = (req.header('authorization') || '').replace('Bearer ', '');
  const token = bearer || req.header('x-admin-token');
  if (verifyAdminToken(token)) return next();
  const payload = verify(token, AUTH_SECRET);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  req.user = payload;
  next();
}
