const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { prisma } = require('../database');
const emailService = require('./emailService');

class AuthService {
  // Normaliser un email (trim + lowercase)
  normalizeEmail(email) {
    if (!email) return null;
    return email.trim().toLowerCase();
  }

  // Générer un token JWT
  generateToken(userId, pseudo) {
    return jwt.sign(
      { userId, pseudo },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  // Vérifier un token JWT
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  // Hasher un mot de passe
  async hashPassword(password) {
    return bcrypt.hash(password, 12);
  }

  // Vérifier un mot de passe
  async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  // Générer un code OTP
  generateOTP() {
    const length = parseInt(process.env.OTP_LENGTH) || 6;
    return crypto.randomInt(100000, 999999).toString().padStart(length, '0');
  }

  // Créer un utilisateur avec mot de passe
  async registerWithPassword(pseudo, password, email = null) {
    // Normaliser l'email
    const normalizedEmail = this.normalizeEmail(email);
    
    // Vérifier si le pseudo existe déjà
    const existingUser = await prisma.dueliste.findUnique({
      where: { pseudo }
    });

    if (existingUser) {
      throw new Error('Ce pseudo est déjà utilisé');
    }

    // Vérifier si l'email existe déjà (si fourni)
    if (normalizedEmail) {
      const existingEmail = await prisma.dueliste.findUnique({
        where: { email: normalizedEmail }
      });

      if (existingEmail) {
        throw new Error('Cet email est déjà utilisé');
      }
    }

    // Hasher le mot de passe
    const passwordHash = await this.hashPassword(password);

    // Créer l'utilisateur
    const user = await prisma.dueliste.create({
      data: {
        pseudo,
        email: normalizedEmail,
        passwordHash,
        authMode: 'PASSWORD',
        emailVerified: normalizedEmail ? false : true // Si pas d'email, on considère comme "vérifié"
      }
    });

    // Générer le token
    const token = this.generateToken(user.id, user.pseudo);

    // Envoyer un email de bienvenue si l'utilisateur a fourni un email
    if (normalizedEmail) {
      try {
        await emailService.sendWelcomeEmail(normalizedEmail, pseudo, false);
        console.log(`Email de bienvenue envoyé à ${normalizedEmail} pour ${pseudo}`);
      } catch (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', emailError);
        // On continue même si l'email échoue
      }
    }

    return {
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email,
        authMode: user.authMode,
        emailVerified: user.emailVerified
      },
      token
    };
  }

  // Créer un utilisateur avec OTP
  async registerWithOTP(pseudo, email) {
    // Normaliser l'email
    const normalizedEmail = this.normalizeEmail(email);
    
    // Vérifier si le pseudo existe déjà
    const existingUser = await prisma.dueliste.findUnique({
      where: { pseudo }
    });

    if (existingUser) {
      throw new Error('Ce pseudo est déjà utilisé');
    }

    // Vérifier si l'email existe déjà
    const existingEmail = await prisma.dueliste.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingEmail) {
      throw new Error('Cet email est déjà utilisé');
    }

    // Générer un OTP
    const otpCode = this.generateOTP();
    const otpExpiry = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000);

    // Créer l'utilisateur
    const user = await prisma.dueliste.create({
      data: {
        pseudo,
        email: normalizedEmail,
        authMode: 'OTP',
        emailVerified: false,
        otpCode,
        otpExpiry
      }
    });

    // Envoyer l'OTP par email
    try {
      await emailService.sendOTPEmail(normalizedEmail, otpCode, pseudo);
      console.log(`OTP envoyé à ${normalizedEmail} pour l'utilisateur ${pseudo}`);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email OTP:', emailError);
      // On continue même si l'email échoue, l'utilisateur peut toujours utiliser l'OTP affiché en console
    }

    return {
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email,
        authMode: user.authMode
      },
      otpCode // Pour debug en développement uniquement
    };
  }

  // Connexion avec mot de passe
  async loginWithPassword(pseudo, password) {
    const user = await prisma.dueliste.findUnique({
      where: { pseudo }
    });

    if (!user || user.authMode !== 'PASSWORD') {
      throw new Error('Utilisateur non trouvé ou méthode d\'authentification incorrecte');
    }

    if (!user.passwordHash) {
      throw new Error('Aucun mot de passe configuré pour cet utilisateur');
    }

    const isValidPassword = await this.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Mot de passe incorrect');
    }

    const token = this.generateToken(user.id, user.pseudo);

    return {
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email,
        authMode: user.authMode,
        emailVerified: user.emailVerified
      },
      token
    };
  }

  // Demander un OTP pour connexion
  async requestOTP(email) {
    const normalizedEmail = this.normalizeEmail(email);
    
    console.log(`Recherche utilisateur avec email: "${email}" -> normalisé: "${normalizedEmail}"`);
    
    const user = await prisma.dueliste.findUnique({
      where: { email: normalizedEmail }
    });

    console.log(`Utilisateur trouvé:`, user ? `ID: ${user.id}, pseudo: ${user.pseudo}, authMode: ${user.authMode}` : 'AUCUN');

    if (!user || user.authMode !== 'OTP') {
      throw new Error('Utilisateur non trouvé ou méthode d\'authentification incorrecte');
    }

    // Générer un nouveau OTP
    const otpCode = this.generateOTP();
    const otpExpiry = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000);

    // Mettre à jour l'utilisateur
    await prisma.dueliste.update({
      where: { id: user.id },
      data: {
        otpCode,
        otpExpiry
      }
    });

    // Envoyer l'OTP par email
    try {
      await emailService.sendOTPEmail(normalizedEmail, otpCode, user.pseudo);
      console.log(`Nouveau OTP envoyé à ${normalizedEmail} pour l'utilisateur ${user.pseudo}`);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email OTP:', emailError);
      // On continue même si l'email échoue
    }

    return {
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email
      },
      otpCode // Pour debug en développement uniquement
    };
  }

  // Vérifier un OTP et connecter
  async verifyOTP(email, otpCode) {
    const normalizedEmail = this.normalizeEmail(email);
    
    const user = await prisma.dueliste.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user || user.authMode !== 'OTP') {
      throw new Error('Utilisateur non trouvé ou méthode d\'authentification incorrecte');
    }

    if (!user.otpCode || user.otpCode !== otpCode) {
      throw new Error('Code OTP incorrect');
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      throw new Error('Code OTP expiré');
    }

    // Nettoyer l'OTP et marquer l'email comme vérifié
    await prisma.dueliste.update({
      where: { id: user.id },
      data: {
        otpCode: null,
        otpExpiry: null,
        emailVerified: true
      }
    });

    const token = this.generateToken(user.id, user.pseudo);

    return {
      user: {
        id: user.id,
        pseudo: user.pseudo,
        email: user.email,
        authMode: user.authMode,
        emailVerified: true
      },
      token
    };
  }

  // Récupérer un utilisateur par token
  async getUserFromToken(token) {
    const decoded = this.verifyToken(token);
    
    const user = await prisma.dueliste.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return {
      id: user.id,
      pseudo: user.pseudo,
      email: user.email,
      authMode: user.authMode,
      emailVerified: user.emailVerified
    };
  }
}

module.exports = new AuthService();