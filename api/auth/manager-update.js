const { sql, ensureTables } = require('../_db');
const { hashPassword, verifyPassword } = require('../_crypto');
const { getSession } = require('../_session');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await ensureTables();
  const session = await getSession(req);
  if (!session || session.kind !== 'manager') {
    res.status(401).json({ error: 'Not authorized.' });
    return;
  }
  const { currentPassword, newUsername, newPassword, newName, newEmail, newPhone } = req.body || {};
  const { rows } = await sql`SELECT * FROM managers WHERE username=${session.subject}`;
  const m = rows[0];
  if (!m || !verifyPassword(currentPassword, m.password_hash)) {
    res.status(401).json({ error: 'Current password is incorrect.' });
    return;
  }
  const username = newUsername || m.username;
  const password_hash = newPassword ? hashPassword(newPassword) : m.password_hash;
  const name = newName || m.name;
  const email = newEmail !== undefined ? newEmail : m.email;
  const phone = newPhone !== undefined ? newPhone : m.phone;

  if (username !== m.username) {
    const dupe = await sql`SELECT id FROM managers WHERE username=${username} AND id<>${m.id}`;
    if (dupe.rows.length) {
      res.status(400).json({ error: 'That username is already taken.' });
      return;
    }
  }

  await sql`UPDATE managers SET username=${username}, password_hash=${password_hash}, name=${name}, email=${email}, phone=${phone} WHERE id=${m.id}`;
  if (username !== session.subject) {
    await sql`UPDATE sessions SET subject=${username} WHERE subject=${session.subject}`;
  }
  res.status(200).json({ ok: true, username, name });
};
