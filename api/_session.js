const { sql, ensureTables } = require('./_db');

async function getSession(req) {
  await ensureTables();
  const auth = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '').trim();
  if (!token) return null;
  const { rows } = await sql`SELECT * FROM sessions WHERE token=${token}`;
  return rows[0] || null;
}

module.exports = { getSession };
