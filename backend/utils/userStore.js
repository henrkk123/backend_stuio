import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const USERS_PATH = path.join(process.cwd(), 'data', 'users.json');

function ensureStore() {
  if (!fs.existsSync(path.dirname(USERS_PATH))) {
    fs.mkdirSync(path.dirname(USERS_PATH), { recursive: true });
  }
  if (!fs.existsSync(USERS_PATH)) {
    fs.writeFileSync(USERS_PATH, JSON.stringify({ users: [] }, null, 2));
  }
}

function loadUsers() {
  ensureStore();
  const raw = fs.readFileSync(USERS_PATH, 'utf8');
  const parsed = JSON.parse(raw || '{"users": []}');
  return Array.isArray(parsed.users) ? parsed.users : [];
}

function saveUsers(users) {
  ensureStore();
  fs.writeFileSync(USERS_PATH, JSON.stringify({ users }, null, 2));
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, user) {
  if (!user?.salt || !user?.hash) return false;
  const { hash } = hashPassword(password, user.salt);
  return hash === user.hash;
}

export { loadUsers, saveUsers, hashPassword, verifyPassword };
