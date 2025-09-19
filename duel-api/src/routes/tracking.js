const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * GET /api/track/email-open/:invitationId
 * Tracker l'ouverture d'un email d'invitation (pixel invisible)
 */
router.get('/email-open/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;

    // Mettre à jour l'invitation avec l'heure d'ouverture
    await prisma.emailInvitation.update({
      where: { id: parseInt(invitationId) },
      data: {
        openedAt: new Date(),
        status: 'OPENED',
        userAgent: req.get('User-Agent') || null,
        ipAddress: anonymizeIP(req.ip),
        referer: req.get('Referer') || null
      }
    });

    // Retourner un pixel transparent 1x1
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      'base64'
    );

    res.set({
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.send(pixel);

  } catch (error) {
    console.error('Erreur tracking ouverture email:', error);
    // Retourner quand même le pixel pour ne pas casser l'affichage
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      'base64'
    );
    res.set('Content-Type', 'image/png');
    res.send(pixel);
  }
});

/**
 * GET /api/track/invitation-click/:invitationId
 * Tracker le clic sur un lien d'invitation et rediriger
 */
router.get('/invitation-click/:invitationId', async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { redirect } = req.query;

    // Mettre à jour l'invitation avec l'heure de clic
    const invitation = await prisma.emailInvitation.update({
      where: { id: parseInt(invitationId) },
      data: {
        clickedAt: new Date(),
        status: 'CLICKED',
        userAgent: req.get('User-Agent') || null,
        ipAddress: anonymizeIP(req.ip),
        referer: req.get('Referer') || null
      },
      include: {
        inviter: {
          select: { pseudo: true }
        }
      }
    });

    // URL de redirection par défaut vers la page d'inscription
    const defaultRedirect = process.env.FRONTEND_URL || 'http://localhost:5173';
    const finalRedirect = redirect || `${defaultRedirect}/register?invitedBy=${encodeURIComponent(invitation.inviter.pseudo)}&invitationId=${invitationId}`;

    res.redirect(finalRedirect);

  } catch (error) {
    console.error('Erreur tracking clic invitation:', error);
    // Rediriger vers la page d'accueil en cas d'erreur
    const fallbackUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(fallbackUrl);
  }
});

/**
 * POST /api/track/invitation-registered
 * Marquer une invitation comme ayant mené à une inscription
 */
router.post('/invitation-registered', async (req, res) => {
  try {
    const { invitationId, newUserId } = req.body;

    if (!invitationId || !newUserId) {
      return res.status(400).json({
        success: false,
        error: 'invitationId et newUserId requis'
      });
    }

    // Mettre à jour l'invitation
    await prisma.emailInvitation.update({
      where: { id: parseInt(invitationId) },
      data: {
        registeredAt: new Date(),
        registeredUserId: parseInt(newUserId),
        status: 'REGISTERED'
      }
    });

    res.json({
      success: true,
      message: 'Conversion d\'invitation enregistrée'
    });

  } catch (error) {
    console.error('Erreur enregistrement conversion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

/**
 * Utilitaire pour anonymiser les adresses IP
 */
function anonymizeIP(ip) {
  if (!ip) return null;
  
  try {
    // Pour IPv4, garder seulement les 3 premiers octets
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
      }
    }
    
    // Pour IPv6, garder seulement le préfixe
    if (ip.includes(':')) {
      const parts = ip.split(':');
      if (parts.length >= 4) {
        return `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}::`;
      }
    }
    
    return ip.substring(0, 10) + 'xxx'; // Fallback
  } catch (error) {
    return 'anonymized';
  }
}

module.exports = router;