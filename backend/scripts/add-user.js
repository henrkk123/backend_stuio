import { initDb } from '../utils/db.js';
import { createUser } from '../utils/userRepo.js';

const args = process.argv.slice(2);
const [emailArg, passwordArg] = args;

if (!emailArg || !passwordArg) {
  console.error('Usage: npm run add-user -- <email> <password>');
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const password = passwordArg.trim();

if (!email || !password || password.length < 6) {
  console.error('Provide a valid email and a password (min. 6 chars).');
  process.exit(1);
}

(async () => {
  try {
    await initDb();
    await createUser(email, password);
    console.log('User created:', email);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create user:', err.message || err);
    process.exit(1);
  }
})();
