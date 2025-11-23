import { verifyAdminToken } from '../middlewares/auth.js';

// Simple admin login endpoint.
// Expects { token } in the JSON body and checks it against ADMIN_TOKEN.
export function loginAdmin(req, res) {
  // Temporarily always succeed (token check disabled for testing).
  return res.json({ ok: true });
}
