const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { prisma } = require('../database');
const emailService = require('./emailService');

const JWT_ISSUER = 'duel-api';
const JWT_AUDIENCE = 'duel-app';
const DUMMY_PASSWORD_HASH = '$2a$12$X3gYvZ6HQ0d3W48qYZ6H4OqJfCe3ZBqU2rjM.0vQ4jO6hYg4fE5vK';

class AuthError extends Error {
  constructor(message, status = 401, code = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.code = code;
  }
}

class AuthService {
  normalizeEmail(email) {
    return email ? email.trim().toLowerCase() : null;
  }

  jwtSecret() {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET non configuré');
    return process.env.JWT_SECRET;
  }

  otpSecret() {
    return process.env.OTP_SECRET || this.jwtSecret();
  }

  toSafeUser(user) {
    return {
      id: user.id,
      pseudo: user.pseudo,
      email: user.email,
      authMode: user.authMode,
      emailVerified: user.emailVerified,
      avatarUrl: user.avatarUrl,
      categorie: user.categorie,
      statut: user.statut
    };
  }

  generateToken(user) {
    return jwt.sign(
      { userId: user.id, pseudo: user.pseudo, tokenVersion: user.tokenVersion || 0 },
      this.jwtSecret(),
      {
        algorithm: 'HS256',
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret(), {
        algorithms: ['HS256'],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      });
    } catch {
      throw new AuthError('Token invalide ou expiré');
    }
  }

  hashOTP(otpCode) {
    return crypto.createHmac('sha256', this.otpSecret()).update(String(otpCode)).digest('hex');
  }

  isValidOTP(candidate, storedHash) {
    if (!storedHash) return false;
    const candidateHash = Buffer.from(this.hashOTP(candidate), 'hex');
    const expectedHash = Buffer.from(storedHash, 'hex');
    return candidateHash.length === expectedHash.length && crypto.timingSafeEqual(candidateHash, expectedHash);
  }

  async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }

  generateOTP() {
    return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
  }

  otpExpiry() {
    const minutes = parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10;
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  async registerWithPassword(pseudo, password, email = null, categorie = 'SENIOR') {
    if (this.normalizeEmail(email)) {
      throw new AuthError('Utilisez la vérification par email pour associer une adresse au compte', 400);
    }

    const existingUser = await prisma.dueliste.findUnique({ where: { pseudo } });
    if (existingUser) throw new AuthError('Ce pseudo est déjà utilisé', 409);

    const passwordHash = await this.hashPassword(password);
    const user = await prisma.dueliste.create({
      data: {
        pseudo,
        email: null,
        passwordHash,
        authMode: 'PASSWORD',
        emailVerified: false,
        categorie
      }
    });

    return { user: this.toSafeUser(user), token: this.generateToken(user) };
  }

  async registerWithOTP(pseudo, email, categorie = 'SENIOR') {
    const normalizedEmail = this.normalizeEmail(email);
    const [existingUser, existingEmail] = await Promise.all([
      prisma.dueliste.findUnique({ where: { pseudo } }),
      prisma.dueliste.findUnique({ where: { email: normalizedEmail } })
    ]);

    if (existingUser) throw new AuthError('Ce pseudo est déjà utilisé', 409);
    if (existingEmail) throw new AuthError('Cet email est déjà utilisé', 409);

    const otpCode = this.generateOTP();
    const user = await prisma.dueliste.create({
      data: {
        pseudo,
        email: normalizedEmail,
        authMode: 'OTP',
        emailVerified: false,
        otpCode: this.hashOTP(otpCode),
        otpExpiry: this.otpExpiry(),
        otpAttempts: 0,
        otpLastSentAt: new Date(),
        otpLockedUntil: null,
        categorie
      }
    });

    try {
      await emailService.sendOTPEmail(normalizedEmail, otpCode, pseudo);
    } catch {
      await prisma.dueliste.delete({ where: { id: user.id } }).catch(() => {});
      throw new AuthError('Impossible d’envoyer le code de vérification', 503);
    }

    return { user: this.toSafeUser(user), requiresOTP: true };
  }

  async loginWithPassword(pseudo, password) {
    const user = await prisma.dueliste.findUnique({ where: { pseudo } });
    const hash = user && user.authMode === 'PASSWORD' && user.passwordHash
      ? user.passwordHash
      : DUMMY_PASSWORD_HASH;
    const passwordIsValid = await bcrypt.compare(password, hash);

    if (!user || user.authMode !== 'PASSWORD' || !passwordIsValid || user.statut !== 'ACTIF') {
      throw new AuthError('Identifiants invalides');
    }

    return { user: this.toSafeUser(user), token: this.generateToken(user) };
  }

  async requestOTP(email) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await prisma.dueliste.findUnique({ where: { email: normalizedEmail } });

    if (!user || user.authMode !== 'OTP' || user.statut !== 'ACTIF') {
      await new Promise((resolve) => setTimeout(resolve, 75));
      return { requiresOTP: true };
    }

    const cooldownMs = (parseInt(process.env.OTP_RESEND_SECONDS, 10) || 60) * 1000;
    if (user.otpLastSentAt && Date.now() - user.otpLastSentAt.getTime() < cooldownMs) {
      return { requiresOTP: true };
    }

    const otpCode = this.generateOTP();
    await prisma.dueliste.update({
      where: { id: user.id },
      data: {
        otpCode: this.hashOTP(otpCode),
        otpExpiry: this.otpExpiry(),
        otpAttempts: 0,
        otpLastSentAt: new Date(),
        otpLockedUntil: null
      }
    });

    try {
      await emailService.sendOTPEmail(normalizedEmail, otpCode, user.pseudo);
    } catch {
      await prisma.dueliste.update({
        where: { id: user.id },
        data: { otpCode: null, otpExpiry: null }
      });
      throw new AuthError('Impossible d’envoyer le code de vérification', 503);
    }

    return { requiresOTP: true };
  }

  async verifyOTP(email, otpCode) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await prisma.dueliste.findUnique({ where: { email: normalizedEmail } });
    const now = new Date();

    if (!user || user.authMode !== 'OTP' || user.statut !== 'ACTIF') {
      throw new AuthError('Code OTP invalide ou expiré');
    }
    if (user.otpLockedUntil && user.otpLockedUntil > now) {
      throw new AuthError('Trop de tentatives. Demandez un nouveau code.', 429, 'OTP_LOCKED');
    }
    if (!user.otpExpiry || user.otpExpiry < now || !this.isValidOTP(otpCode, user.otpCode)) {
      const attempts = (user.otpAttempts || 0) + 1;
      await prisma.dueliste.update({
        where: { id: user.id },
        data: {
          otpAttempts: attempts,
          otpLockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
          ...(attempts >= 5 ? { otpCode: null, otpExpiry: null } : {})
        }
      });
      throw new AuthError('Code OTP invalide ou expiré');
    }

    const updatedUser = await prisma.dueliste.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpiry: null,
        otpAttempts: 0,
        otpLockedUntil: null,
        emailVerified: true
      }
    });

    return { user: this.toSafeUser(updatedUser), token: this.generateToken(updatedUser) };
  }

  async getUserFromToken(token) {
    const decoded = this.verifyToken(token);
    const user = await prisma.dueliste.findUnique({ where: { id: decoded.userId } });

    if (!user || user.statut !== 'ACTIF' || (user.tokenVersion || 0) !== (decoded.tokenVersion || 0)) {
      throw new AuthError('Token invalide ou expiré');
    }
    return this.toSafeUser(user);
  }

  async logout(userId) {
    await prisma.dueliste.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } }
    });
  }
}

module.exports = new AuthService();
module.exports.AuthError = AuthError;
