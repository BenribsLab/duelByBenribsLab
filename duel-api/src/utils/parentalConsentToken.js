const crypto = require('crypto');

// Meme construction que trackingToken.js, avec un role encode dans la charge
// utile : sans lui, un lien envoye au parent pourrait etre rejoue comme lien
// d'approbation admin (et inversement), puisque les deux portent le meme
// consentId.
const ROLES = new Set(['parent', 'admin']);

function secret() {
  const value = process.env.PARENTAL_CONSENT_SECRET || process.env.TRACKING_SECRET;
  if (!value) throw new Error('PARENTAL_CONSENT_SECRET non configuré');
  return value;
}

function signature(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

function createParentalConsentToken(consentId, role, expiresAt) {
  if (!ROLES.has(role)) throw new Error(`Rôle de consentement invalide: ${role}`);
  const payload = Buffer.from(`${consentId}:${role}:${new Date(expiresAt).getTime()}`).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

function verifyParentalConsentToken(token, expectedRole) {
  if (typeof token !== 'string' || token.length > 256) return null;
  const [payload, suppliedSignature, extra] = token.split('.');
  if (!payload || !suppliedSignature || extra) return null;
  const expected = Buffer.from(signature(payload));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) return null;

  const decoded = Buffer.from(payload, 'base64url').toString('utf8');
  const [idValue, role, expiresValue] = decoded.split(':');
  const consentId = Number(idValue);
  const expiresAt = Number(expiresValue);

  if (!Number.isSafeInteger(consentId) || consentId < 1) return null;
  if (!ROLES.has(role) || role !== expectedRole) return null;
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;

  return { consentId, role, expiresAt };
}

module.exports = { createParentalConsentToken, verifyParentalConsentToken };
