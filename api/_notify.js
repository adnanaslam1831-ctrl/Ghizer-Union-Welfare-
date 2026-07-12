async function sendEmail(to, subject, text) {
  if (!process.env.RESEND_API_KEY || !to) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || 'Ghizer Union Welfare Organization <onboarding@resend.dev>',
        to: [to],
        subject,
        text,
      }),
    });
    if (!res.ok) console.error('Resend error', res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error('sendEmail failed', e);
    return false;
  }
}

async function sendSMS(to, body) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !to) return false;
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
    const params = new URLSearchParams({
      From: process.env.TWILIO_FROM_NUMBER,
      To: to,
      Body: body,
    });
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    if (!res.ok) console.error('Twilio error', res.status, await res.text());
    return res.ok;
  } catch (e) {
    console.error('sendSMS failed', e);
    return false;
  }
}

module.exports = { sendEmail, sendSMS };
