const crypto = require('crypto');

function secret() {
  const value = process.env.TRACKING_SECRET || process.env.JWT_SECRET;
  if (!value) throw new Error('TRACKING_SECRET non configuré');
  return value;
}

function signature(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

function createTrackingToken(invitationId, expiresAt) {
  const payload = Buffer.from(`${invitationId}:${new Date(expiresAt).getTime()}`).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

function verifyTrackingToken(token) {
  if (typeof token !== 'string' || token.length > 256) return null;
  const [payload, suppliedSignature, extra] = token.split('.');
  if (!payload || !suppliedSignature || extra) return null;
  const expected = Buffer.from(signature(payload));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return null;

  const decoded = Buffer.from(payload, 'base64url').toString('utf8');
  const [idValue, expiresValue] = decoded.split(':');
  const invitationId = Number(idValue);
  const expiresAt = Number(expiresValue);
  if (!Number.isSafeInteger(invitationId) || invitationId < 1 || !Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return null;
  }
  return { invitationId, expiresAt };
}

module.exports = { createTrackingToken, verifyTrackingToken };
