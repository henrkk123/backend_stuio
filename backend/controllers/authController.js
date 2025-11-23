import { sign } from '../utils/jwt.js';
import { createUser, verifyUser, findUserByEmail } from '../utils/userRepo.js';

const AUTH_SECRET = process.env.AUTH_SECRET || 'change-me-secret';

function createToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    iat: Math.floor(Date.now() / 1000)
  };
  return sign(payload, AUTH_SECRET);
}

export function signup(req, res) {
  (async () => {
    try {
      const { email = '', password = '' } = req.body || {};
      if (!process.env.DATABASE_URL) return res.status(500).json({ error: 'DB nicht konfiguriert.' });
      if (!email || !password || password.length < 6) {
        return res.status(400).json({ error: 'E-Mail und Passwort (min. 6 Zeichen) erforderlich.' });
      }
      const existing = await findUserByEmail(email);
      if (existing) return res.status(409).json({ error: 'E-Mail bereits registriert.' });
      const user = await createUser(email, password);
      const token = createToken({ id: user.id, email: user.email });
      res.json({ ok: true, token, user: { email: user.email } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Signup fehlgeschlagen.' });
    }
  })();
}

export function login(req, res) {
  (async () => {
    try {
      const { email = '', password = '' } = req.body || {};
      if (!process.env.DATABASE_URL) return res.status(500).json({ error: 'DB nicht konfiguriert.' });
      const user = await verifyUser(email, password);
      if (!user) return res.status(401).json({ error: 'Falsche Zugangsdaten.' });
      const token = createToken(user);
      res.json({ ok: true, token, user: { email: user.email } });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Login fehlgeschlagen.' });
    }
  })();
}
