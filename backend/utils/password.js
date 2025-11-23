import crypto from 'crypto';

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, user) {
  if (!user?.salt || !user?.hash) return false;
  const { hash } = hashPassword(password, user.salt);
  return hash === user.hash;
}
