function validateSecurityConfig() {
  if (process.env.NODE_ENV !== 'production') return;

  const requiredSecrets = ['JWT_SECRET', 'ADMIN_JWT_SECRET', 'OTP_SECRET', 'TRACKING_SECRET', 'PARENTAL_CONSENT_SECRET'];
  const missing = requiredSecrets.filter((name) => {
    const value = process.env[name] || '';
    return value.length < 32 || /change|replace|votre|example/i.test(value);
  });
  if (missing.length > 0) {
    throw new Error(`Secrets absents ou trop courts (32 caractères minimum): ${missing.join(', ')}`);
  }
  if (process.env.JWT_SECRET === process.env.ADMIN_JWT_SECRET) {
    throw new Error('ADMIN_JWT_SECRET doit être différent de JWT_SECRET');
  }
  if (!/^\$2[aby]\$\d{2}\$.{53}$/.test(process.env.ADMIN_PASSWORD_HASH || '')) {
    throw new Error('ADMIN_PASSWORD_HASH doit contenir un hash bcrypt valide');
  }
}

module.exports = { validateSecurityConfig };
