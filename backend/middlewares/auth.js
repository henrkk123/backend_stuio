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
  // User-Guard vorübergehend deaktiviert für einfaches Testen.
  next();
}

// Guard für geschützte Admin-Routen (config, export, etc.).
export function requireAdmin(req, res, next) {
  // Für Tests komplett offen – keine Authentifizierung.
  next();
}
