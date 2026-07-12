const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  try {
    const check = crypto.scryptSync(String(password), salt, 64).toString('hex');
    const a = Buffer.from(hash, 'hex');
    const b = Buffer.from(check, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch (e) {
    return false;
  }
}

function genToken() {
  return crypto.randomBytes(24).toString('hex');
}

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = { hashPassword, verifyPassword, genToken, genCode };
