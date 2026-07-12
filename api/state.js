const { sql, ensureTables } = require('./_db');
const { getSession } = require('./_session');
const { hashPassword } = require('./_crypto');

function defaultState() {
  return {
    settings: {
      orgName: 'Ghizer Union Welfare Organization',
      tagline: 'Strength in savings. Security in community.',
      currency: 'PKR (Rs)',
      phone: '',
      email: '',
      interestRate: 10.0,
      method: 'Average Balance',
      frequency: 'Annual',
      loanRate: 8.0,
    },
    members: [],
    deposits: [],
    withdrawals: [],
    loans: [],
    ledger: [],
    transactions: [],
    auditLog: [],
    counters: { member: 0, receipt: 20000, loan: 200, txn: 58000 },
  };
}

module.exports = async (req, res) => {
  await ensureTables();

  if (req.method === 'GET') {
    const { rows } = await sql`SELECT data FROM app_data WHERE id='coop'`;
    const { rows: mgrRows } = await sql`SELECT id FROM managers LIMIT 1`;
    const data = rows[0] ? rows[0].data : defaultState();
    if (Array.isArray(data.members)) {
      data.members = data.members.map((m) => {
        const { passwordHash, ...rest } = m;
        return { ...rest, hasPassword: !!passwordHash };
      });
    }
    res.status(200).json({ data, hasManager: mgrRows.length > 0 });
    return;
  }

  if (req.method === 'POST') {
    const session = await getSession(req);
    if (!session || session.kind !== 'manager') {
      res.status(401).json({ error: 'Not authorized.' });
      return;
    }
    const incoming = req.body || {};
    const { rows } = await sql`SELECT data FROM app_data WHERE id='coop'`;
    const existing = rows[0] ? rows[0].data : defaultState();
    const existingById = {};
    (existing.members || []).forEach((m) => (existingById[m.id] = m));

    const members = (incoming.members || []).map((m) => {
      const prev = existingById[m.id];
      let passwordHash = prev ? prev.passwordHash : undefined;
      if (m.newPassword) passwordHash = hashPassword(m.newPassword);
      const { newPassword, hasPassword, ...rest } = m;
      return { ...rest, passwordHash };
    });

    const toSave = { ...incoming, members };
    await sql`INSERT INTO app_data (id, data) VALUES ('coop', ${JSON.stringify(toSave)}::jsonb)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`;
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
