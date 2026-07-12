const { sql, ensureTables } = require('../_db');
const { verifyPassword, genToken } = require('../_crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await ensureTables();
  const { username, password } = req.body || {};
  const { rows } = await sql`SELECT * FROM managers WHERE username=${username}`;
  const m = rows[0];
  if (!m || !verifyPassword(password, m.password_hash)) {
    res.status(401).json({ error: 'Incorrect username or password.' });
    return;
  }
  const token = genToken();
  await sql`INSERT INTO sessions (token, kind, subject) VALUES (${token}, 'manager', ${username})`;
  res.status(200).json({ token, name: m.name });
};
