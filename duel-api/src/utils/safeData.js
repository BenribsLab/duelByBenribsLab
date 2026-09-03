const SENSITIVE_USER_FIELDS = new Set([
  'passwordHash',
  'otpCode',
  'otpExpiry',
  'otpAttempts',
  'otpLastSentAt',
  'otpLockedUntil',
  'pushToken',
  'tokenVersion'
]);

const PUBLIC_DUELLISTE_SELECT = Object.freeze({
  id: true,
  pseudo: true,
  avatarUrl: true,
  dateInscription: true,
  statut: true,
  nbVictoires: true,
  nbDefaites: true,
  nbMatchsTotal: true,
  indiceTouches: true,
  categorie: true,
  createdAt: true,
  updatedAt: true
});

const SELF_DUELLISTE_SELECT = Object.freeze({
  ...PUBLIC_DUELLISTE_SELECT,
  email: true,
  authMode: true,
  emailVerified: true,
  derniereConsultationNotifications: true
});

const DUELLISTE_BRIEF_SELECT = Object.freeze({
  id: true,
  pseudo: true,
  avatarUrl: true
});

function sanitizeForResponse(value) {
  if (value === null || value === undefined || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date || Buffer.isBuffer(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeForResponse);
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !SENSITIVE_USER_FIELDS.has(key))
      .map(([key, child]) => [key, sanitizeForResponse(child)])
  );
}

function safeJsonResponses(req, res, next) {
  const sendJson = res.json.bind(res);
  res.json = (body) => sendJson(sanitizeForResponse(body));
  next();
}

module.exports = {
  PUBLIC_DUELLISTE_SELECT,
  SELF_DUELLISTE_SELECT,
  DUELLISTE_BRIEF_SELECT,
  sanitizeForResponse,
  safeJsonResponses
};
