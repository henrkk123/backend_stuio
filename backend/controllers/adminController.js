import { verifyAdminToken } from '../middlewares/auth.js';
import { verify } from '../utils/jwt.js';

const AUTH_SECRET = process.env.AUTH_SECRET || 'change-me-secret';

// Simple admin login endpoint.
// Expects { token } in the JSON body and checks it against ADMIN_TOKEN.
export function loginAdmin(req, res) {
  // Legacy endpoint: accept admin token or user token.
  const { token = '' } = req.body || {};
  if (verifyAdminToken(token)) return res.json({ ok: true });
  const payload = verify(token, AUTH_SECRET);
  if (payload) return res.json({ ok: true, user: { email: payload.email } });
  return res.status(401).json({ error: 'Invalid token' });
}
