const { sql, ensureTables } = require('../_db');
const { hashPassword, genToken } = require('../_crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await ensureTables();
  const { name, username, password, email, phone } = req.body || {};
  if (!name || !username || !password) {
    res.status(400).json({ error: 'Please fill in name, username, and password.' });
    return;
  }
  const existing = await sql`SELECT id FROM managers LIMIT 1`;
  if (existing.rows.length) {
    res.status(400).json({ error: 'A manager account already exists. Please log in instead.' });
    return;
  }
  const password_hash = hashPassword(password);
  await sql`INSERT INTO managers (name, username, password_hash, email, phone)
    VALUES (${name}, ${username}, ${password_hash}, ${email || null}, ${phone || null})`;
  const token = genToken();
  await sql`INSERT INTO sessions (token, kind, subject) VALUES (${token}, 'manager', ${username})`;
  res.status(200).json({ token, name });
};
