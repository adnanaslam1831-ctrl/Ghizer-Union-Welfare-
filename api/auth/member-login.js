const { sql, ensureTables } = require('../_db');
const { verifyPassword, genToken } = require('../_crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await ensureTables();
  const { cnic, password } = req.body || {};
  const { rows } = await sql`SELECT data FROM app_data WHERE id='coop'`;
  const data = rows[0] ? rows[0].data : null;
  const member = data && (data.members || []).find((m) => m.cnic === cnic);
  if (!member || !verifyPassword(password, member.passwordHash)) {
    res.status(401).json({ error: 'Incorrect CNIC or password.' });
    return;
  }
  const token = genToken();
  await sql`INSERT INTO sessions (token, kind, subject) VALUES (${token}, 'member', ${member.id})`;
  res.status(200).json({ token, memberId: member.id });
};
