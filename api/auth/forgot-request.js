const { sql, ensureTables } = require('../_db');
const { genCode } = require('../_crypto');
const { sendEmail, sendSMS } = require('../_notify');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  await ensureTables();
  const { kind, identifier, channel } = req.body || {}; // kind: 'manager' | 'member'
  if (!kind || !identifier) {
    res.status(400).json({ error: 'Please fill in this field.' });
    return;
  }

  let email = null;
  let phone = null;

  if (kind === 'manager') {
    const { rows } = await sql`SELECT email, phone FROM managers WHERE username=${identifier}`;
    if (rows[0]) {
      email = rows[0].email;
      phone = rows[0].phone;
    }
  } else {
    const { rows } = await sql`SELECT data FROM app_data WHERE id='coop'`;
    const data = rows[0] ? rows[0].data : null;
    const member = data && (data.members || []).find((m) => m.cnic === identifier);
    if (member) {
      email = member.email;
      phone = member.phone;
    }
  }

  // Always respond success either way, to avoid revealing which accounts exist.
  if (email || phone) {
    const code = genCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    await sql`INSERT INTO reset_codes (kind, identifier, code, expires_at) VALUES (${kind}, ${identifier}, ${code}, ${expires})`;
    const msg = `Your Ghizer Union Welfare Organization verification code is ${code}. It expires in 10 minutes.`;
    const wantEmail = channel === 'email' || channel === 'both';
    const wantSms = channel === 'sms' || channel === 'both';
    if (wantEmail && email) await sendEmail(email, 'Your verification code', msg);
    if (wantSms && phone) await sendSMS(phone, msg);
  }

  res.status(200).json({ ok: true });
};
