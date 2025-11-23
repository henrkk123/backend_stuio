import pkg from 'pg';

const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL || '';
const useSsl = connectionString.startsWith('postgres://') || connectionString.startsWith('postgresql://');

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false
});

export async function initDb() {
  if (!connectionString) {
    console.warn('DATABASE_URL not set – DB features disabled.');
    return;
  }
  await pool.query(`
    create table if not exists users (
      id serial primary key,
      email text unique not null,
      salt text not null,
      hash text not null,
      created_at timestamp with time zone default now()
    );
  `);
}

export function query(text, params) {
  return pool.query(text, params);
}
