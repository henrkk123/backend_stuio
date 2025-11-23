import { verifyAdminToken } from '../middlewares/auth.js';

// Simple admin login endpoint.
// Expects { token } in the JSON body and checks it against ADMIN_TOKEN.
export function loginAdmin(req, res) {
  const { token = '' } = req.body || {};

  // If no ADMIN_TOKEN is configured, treat all logins as successful.
  if (verifyAdminToken(token)) {
    return res.json({ ok: true });
  }

  return res.status(401).json({ error: 'Invalid admin token' });
}

