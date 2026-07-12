const { sql, ensureTables } = require('../_db');
const { hashPassword } = require('../_crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await ensureTables();
  const { kind, identifier, code, newPassword } = req.body || {};
  if (!kind || !identifier || !code || !newPassword) {
    res.status(400).json({ error: 'Please fill in every field.' });
    return;
  }
  if (newPassword.length < 4) {
    res.status(400).json({ error: 'New password must be at least 4 characters.' });
    return;
  }

  const { rows } = await sql`SELECT * FROM reset_codes WHERE kind=${kind} AND identifier=${identifier} AND code=${code} ORDER BY id DESC LIMIT 1`;
  const rec = rows[0];
  if (!rec || new Date(rec.expires_at) < new Date()) {
    res.status(400).json({ error: 'Invalid or expired code.' });
    return;
  }

  if (kind === 'manager') {
    await sql`UPDATE managers SET password_hash=${hashPassword(newPassword)} WHERE username=${identifier}`;
  } else {
    const { rows: dRows } = await sql`SELECT data FROM app_data WHERE id='coop'`;
    const data = dRows[0] ? dRows[0].data : null;
    if (!data) {
      res.status(404).json({ error: 'No data found.' });
      return;
    }
    const idx = data.members.findIndex((m) => m.cnic === identifier);
    if (idx < 0) {
      res.status(404).json({ error: 'Member not found.' });
      return;
    }
    data.members[idx].passwordHash = hashPassword(newPassword);
    await sql`UPDATE app_data SET data=${JSON.stringify(data)}::jsonb WHERE id='coop'`;
  }

  await sql`DELETE FROM reset_codes WHERE id=${rec.id}`;
  res.status(200).json({ ok: true });
};
