const { prisma } = require('../database');
const emailService = require('./emailService');
const { createParentalConsentToken, verifyParentalConsentToken } = require('../utils/parentalConsentToken');

const CONSENT_VALIDITY_DAYS = 30;

class ParentalConsentError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'ParentalConsentError';
    this.status = status;
  }
}

function frontendUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
}

function expiryDate() {
  return new Date(Date.now() + CONSENT_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
}

class ParentalConsentService {
  /**
   * Crée la demande de consentement et envoie l'e-mail au parent. Appelée à
   * l'inscription d'un compte Junior : si l'envoi échoue, l'appelant doit
   * annuler la création du compte (même logique que l'OTP d'inscription).
   */
  async requestConsent(duelisteId, pseudo, parentEmail) {
    const expiresAt = expiryDate();

    const consent = await prisma.parentalConsent.create({
      data: { duelisteId, parentEmail, status: 'PENDING_PARENT', expiresAt }
    });

    const token = createParentalConsentToken(consent.id, 'parent', expiresAt);
    const decisionUrl = `${frontendUrl()}/consentement-parental?token=${encodeURIComponent(token)}`;

    try {
      await emailService.sendParentalConsentRequestEmail(parentEmail, pseudo, decisionUrl);
    } catch (error) {
      await prisma.parentalConsent.delete({ where: { id: consent.id } }).catch(() => {});
      throw new ParentalConsentError('Impossible d\'envoyer l\'e-mail au parent', 503);
    }

    return consent;
  }

  async _loadConsent(token, expectedRole) {
    const verified = verifyParentalConsentToken(token, expectedRole);
    if (!verified) throw new ParentalConsentError('Lien invalide ou expiré', 400);

    const consent = await prisma.parentalConsent.findUnique({
      where: { id: verified.consentId },
      include: { dueliste: { select: { id: true, pseudo: true, statut: true } } }
    });
    if (!consent) throw new ParentalConsentError('Demande de consentement introuvable', 404);
    if (consent.expiresAt < new Date()) throw new ParentalConsentError('Cette demande a expiré', 410);

    return consent;
  }

  /** Aperçu affiché sur la page de décision, avant que le parent ou l'admin ne choisisse. */
  async getDecisionInfo(token, role) {
    const consent = await this._loadConsent(token, role);
    return {
      pseudo: consent.dueliste.pseudo,
      parentEmail: consent.parentEmail,
      status: consent.status
    };
  }

  async decideAsParent(token, decision) {
    const consent = await this._loadConsent(token, 'parent');
    if (consent.status !== 'PENDING_PARENT') {
      throw new ParentalConsentError('Cette demande a déjà été traitée', 409);
    }

    if (decision === 'reject') {
      await prisma.dueliste.delete({ where: { id: consent.duelisteId } }).catch(() => {});
      await prisma.parentalConsent.update({
        where: { id: consent.id },
        data: { status: 'REJECTED', parentDecidedAt: new Date() }
      }).catch(() => {});
      return { status: 'REJECTED' };
    }

    const updated = await prisma.parentalConsent.update({
      where: { id: consent.id },
      data: { status: 'PENDING_ADMIN', parentDecidedAt: new Date() }
    });

    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (adminEmail) {
      const adminToken = createParentalConsentToken(consent.id, 'admin', consent.expiresAt);
      const adminUrl = `${frontendUrl()}/admin/consentement-parental?token=${encodeURIComponent(adminToken)}`;
      emailService
        .sendParentalConsentAdminReviewEmail(adminEmail, consent.dueliste.pseudo, consent.parentEmail, adminUrl)
        .catch((error) => console.error('Erreur notification admin (consentement parental):', error.message));
    } else {
      console.warn('ADMIN_NOTIFICATION_EMAIL non configuré : consentement parent reçu, admin non notifié.');
    }

    return { status: updated.status };
  }

  async decideAsAdmin(token, decision) {
    const consent = await this._loadConsent(token, 'admin');
    if (consent.status !== 'PENDING_ADMIN') {
      throw new ParentalConsentError('Cette demande n\'est pas en attente d\'approbation admin', 409);
    }

    if (decision === 'reject') {
      await prisma.dueliste.delete({ where: { id: consent.duelisteId } }).catch(() => {});
      await prisma.parentalConsent.update({
        where: { id: consent.id },
        data: { status: 'REJECTED', adminDecidedAt: new Date() }
      }).catch(() => {});
      return { status: 'REJECTED' };
    }

    await prisma.$transaction([
      prisma.dueliste.update({ where: { id: consent.duelisteId }, data: { statut: 'ACTIF' } }),
      prisma.parentalConsent.update({
        where: { id: consent.id },
        data: { status: 'APPROVED', adminDecidedAt: new Date() }
      })
    ]);

    return { status: 'APPROVED' };
  }
}

module.exports = new ParentalConsentService();
module.exports.ParentalConsentError = ParentalConsentError;
