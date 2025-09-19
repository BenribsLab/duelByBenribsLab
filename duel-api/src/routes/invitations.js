const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const emailService = require('../services/emailService');
const auth = require('../middleware/auth');

const prisma = new PrismaClient();

/**
 * POST /api/invitations/email
 * Envoyer une invitation par email
 */
router.post('/email', auth, async (req, res) => {
  try {
    const { email, recipientName } = req.body;
    const inviterId = req.user.id;

    // Validation des données
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requis'
      });
    }

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Format email invalide'
      });
    }

    // Récupérer les infos de l'inviteur
    const inviter = await prisma.dueliste.findUnique({
      where: { id: inviterId }
    });

    if (!inviter) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur inviteur non trouvé'
      });
    }

    // Vérifier si l'email est déjà inscrit
    const existingUser = await prisma.dueliste.findFirst({
      where: {
        email: email
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Cette personne est déjà inscrite',
        userExists: true,
        existingUser: {
          id: existingUser.id,
          pseudo: existingUser.pseudo
        }
      });
    }

    // Vérifier si une invitation récente existe déjà
    const recentInvitation = await prisma.emailInvitation.findFirst({
      where: {
        email: email,
        inviterId: inviterId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24h
        }
      }
    });

    if (recentInvitation) {
      return res.status(429).json({
        success: false,
        error: 'Une invitation a déjà été envoyée à cette adresse dans les dernières 24h'
      });
    }

    // Envoyer l'email d'invitation
    await emailService.sendInvitationEmail(
      email,
      inviter.pseudo, // Utiliser le pseudo comme nom d'affichage
      inviter.pseudo,
      recipientName
    );

    // Enregistrer l'invitation en base
    await prisma.emailInvitation.create({
      data: {
        email: email,
        recipientName: recipientName || null,
        inviterId: inviterId,
        status: 'SENT'
      }
    });

    res.json({
      success: true,
      message: 'Invitation envoyée avec succès',
      data: {
        email: email,
        inviterPseudo: inviter.pseudo,
        sentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de l\'envoi de l\'invitation'
    });
  }
});

/**
 * GET /api/invitations/check-email
 * Vérifier si un email est déjà inscrit
 */
router.get('/check-email', auth, async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email requis'
      });
    }

    // Validation format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Format email invalide',
        isValid: false
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.dueliste.findFirst({
      where: {
        email: email
      },
      select: {
        id: true,
        pseudo: true
      }
    });

    res.json({
      success: true,
      data: {
        email: email,
        exists: !!existingUser,
        user: existingUser || null,
        isValid: true
      }
    });

  } catch (error) {
    console.error('Erreur lors de la vérification de l\'email:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la vérification'
    });
  }
});

/**
 * GET /api/invitations/my-invitations
 * Récupérer les invitations envoyées par l'utilisateur connecté
 */
router.get('/my-invitations', auth, async (req, res) => {
  try {
    const inviterId = req.user.id;

    const invitations = await prisma.emailInvitation.findMany({
      where: { inviterId: inviterId },
      orderBy: { createdAt: 'desc' },
      take: 20 // Limiter à 20 invitations récentes
    });

    res.json({
      success: true,
      data: invitations
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des invitations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des invitations'
    });
  }
});

module.exports = router;