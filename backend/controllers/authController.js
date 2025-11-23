import { sign } from '../utils/jwt.js';
import { loadUsers, saveUsers, hashPassword, verifyPassword } from '../utils/userStore.js';

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
  try {
    const { email = '', password = '' } = req.body || {};
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password || password.length < 6) {
      return res.status(400).json({ error: 'E-Mail und Passwort (min. 6 Zeichen) erforderlich.' });
    }
    const users = loadUsers();
    if (users.find((u) => u.email === normalized)) {
      return res.status(409).json({ error: 'E-Mail bereits registriert.' });
    }
    const { salt, hash } = hashPassword(password);
    const user = { id: `user_${Date.now()}`, email: normalized, salt, hash, createdAt: new Date().toISOString() };
    users.push(user);
    saveUsers(users);
    const token = createToken(user);
    res.json({ ok: true, token, user: { email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup fehlgeschlagen.' });
  }
}

export function login(req, res) {
  try {
    const { email = '', password = '' } = req.body || {};
    const normalized = email.trim().toLowerCase();
    const users = loadUsers();
    const user = users.find((u) => u.email === normalized);
    if (!user || !verifyPassword(password, user)) {
      return res.status(401).json({ error: 'Falsche Zugangsdaten.' });
    }
    const token = createToken(user);
    res.json({ ok: true, token, user: { email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login fehlgeschlagen.' });
  }
}
