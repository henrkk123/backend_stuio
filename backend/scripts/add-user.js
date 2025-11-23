import { loadUsers, saveUsers, hashPassword } from '../utils/userStore.js';

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

const users = loadUsers();
if (users.find((u) => u.email === email)) {
  console.error('User already exists:', email);
  process.exit(1);
}

const { salt, hash } = hashPassword(password);
const user = { id: `user_${Date.now()}`, email, salt, hash, createdAt: new Date().toISOString() };
users.push(user);
saveUsers(users);

console.log('User created:', email);
