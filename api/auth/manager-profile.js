const { sql, ensureTables } = require('../_db');
const { getSession } = require('../_session');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  await ensureTables();
  const session = await getSession(req);
  if (!session || session.kind !== 'manager') {
    res.status(401).json({ error: 'Not authorized.' });
    return;
  }
  const { rows } = await sql`SELECT name, username, email, phone FROM managers WHERE username=${session.subject}`;
  if (!rows[0]) {
    res.status(404).json({ error: 'Manager account not found.' });
    return;
  }
  res.status(200).json(rows[0]);
};
