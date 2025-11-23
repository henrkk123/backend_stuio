import { query } from './db.js';
import { hashPassword, verifyPassword } from './password.js';

export async function findUserByEmail(email) {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return null;
  const res = await query('select id, email, salt, hash from users where email = $1 limit 1', [normalized]);
  return res.rows[0] || null;
}

export async function createUser(email, password) {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized || !password || password.length < 6) {
    throw new Error('E-Mail und Passwort (min. 6 Zeichen) erforderlich.');
  }
  const existing = await findUserByEmail(normalized);
  if (existing) throw new Error('E-Mail bereits registriert.');
  const { salt, hash } = hashPassword(password);
  await query('insert into users (email, salt, hash) values ($1, $2, $3)', [normalized, salt, hash]);
  return { email: normalized, salt, hash };
}

export async function verifyUser(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = verifyPassword(password, user);
  return ok ? user : null;
}
