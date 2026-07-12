const { sql, ensureTables } = require('../_db');
const { hashPassword, verifyPassword } = require('../_crypto');
const { getSession } = require('../_session');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await ensureTables();
  const session = await getSession(req);
  if (!session || session.kind !== 'member') {
    res.status(401).json({ error: 'Not authorized.' });
    return;
  }
  const { currentPassword, newPassword } = req.body || {};
  const { rows } = await sql`SELECT data FROM app_data WHERE id='coop'`;
  const data = rows[0] ? rows[0].data : null;
  if (!data) {
    res.status(404).json({ error: 'No data found.' });
    return;
  }
  const idx = data.members.findIndex((m) => m.id === session.subject);
  if (idx < 0) {
    res.status(404).json({ error: 'Member not found.' });
    return;
  }
  if (!verifyPassword(currentPassword, data.members[idx].passwordHash)) {
    res.status(401).json({ error: 'Current password is incorrect.' });
    return;
  }
  data.members[idx].passwordHash = hashPassword(newPassword);
  await sql`UPDATE app_data SET data=${JSON.stringify(data)}::jsonb WHERE id='coop'`;
  res.status(200).json({ ok: true });
};
