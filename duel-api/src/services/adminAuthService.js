const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const DUMMY_HASH = '$2a$12$X3gYvZ6HQ0d3W48qYZ6H4OqJfCe3ZBqU2rjM.0vQ4jO6hYg4fE5vK';

class AdminAuthService {
  secret() {
    if (!process.env.ADMIN_JWT_SECRET) throw new Error('Administration non configurée');
    return process.env.ADMIN_JWT_SECRET;
  }

  async verifyAdminCredentials(username, password) {
    const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
    const configuredHash = process.env.ADMIN_PASSWORD_HASH;
    const passwordValid = await bcrypt.compare(password, configuredHash || DUMMY_HASH);
    const supplied = Buffer.from(String(username));
    const expected = Buffer.from(expectedUsername);
    const usernameValid = supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
    return Boolean(configuredHash && usernameValid && passwordValid);
  }

  generateAdminToken(username) {
    return jwt.sign(
      { username, role: 'admin', type: 'admin_session' },
      this.secret(),
      {
        algorithm: 'HS256',
        issuer: 'duel-api',
        audience: 'duel-admin',
        expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '1h'
      }
    );
  }

  verifyAdminToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret(), {
        algorithms: ['HS256'],
        issuer: 'duel-api',
        audience: 'duel-admin'
      });
      if (decoded.role !== 'admin' || decoded.type !== 'admin_session') throw new Error();
      return decoded;
    } catch {
      throw new Error('Token admin invalide ou expiré');
    }
  }

  async loginAdmin(username, password) {
    if (!await this.verifyAdminCredentials(username, password)) {
      throw new Error('Identifiants administrateur invalides');
    }
    return { token: this.generateAdminToken(username) };
  }
}

module.exports = new AdminAuthService();
