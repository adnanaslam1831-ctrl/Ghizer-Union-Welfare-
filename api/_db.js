const { sql } = require('@vercel/postgres');

let ensured = false;
async function ensureTables() {
  if (ensured) return;
  await sql`CREATE TABLE IF NOT EXISTS managers (
    id SERIAL PRIMARY KEY,
    name TEXT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    phone TEXT
  )`;
  await sql`CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    subject TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS app_data (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS reset_codes (
    id SERIAL PRIMARY KEY,
    kind TEXT NOT NULL,
    identifier TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
  )`;
  ensured = true;
}

module.exports = { sql, ensureTables };
