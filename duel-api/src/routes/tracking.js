const express = require('express');
const { prisma } = require('../database');
const { authenticateToken } = require('../middleware/auth');
const { verifyTrackingToken } = require('../utils/trackingToken');

const router = express.Router();
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64'
);

function pixel(res) {
  res.set({
    'Content-Type': 'image/png',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0'
  });
  return res.send(PIXEL);
}

function metadata(req) {
  return {
    userAgent: (req.get('User-Agent') || '').slice(0, 500) || null,
    ipAddress: anonymizeIP(req.ip),
    referer: (req.get('Referer') || '').slice(0, 500) || null
  };
}

router.get('/email-open/:trackingToken', async (req, res) => {
  try {
    const verified = verifyTrackingToken(req.params.trackingToken);
    if (verified) {
      await prisma.emailInvitation.updateMany({
        where: { id: verified.invitationId, status: { in: ['PENDING', 'SENT'] } },
        data: { openedAt: new Date(), status: 'OPENED', ...metadata(req) }
      });
    }
  } catch (error) {
    console.error('Erreur tracking ouverture email:', error.message);
  }
  return pixel(res);
});

router.get('/invitation-click/:trackingToken', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const verified = verifyTrackingToken(req.params.trackingToken);
    if (!verified) return res.redirect(frontendUrl);

    const invitation = await prisma.emailInvitation.findUnique({
      where: { id: verified.invitationId },
      include: { inviter: { select: { pseudo: true } } }
    });
    if (!invitation || invitation.expiresAt < new Date()) return res.redirect(frontendUrl);

    if (invitation.status !== 'REGISTERED') {
      await prisma.emailInvitation.update({
        where: { id: invitation.id },
        data: { clickedAt: new Date(), status: 'CLICKED', ...metadata(req) }
      });
    }

    const query = new URLSearchParams({
      invitedBy: invitation.inviter.pseudo,
      invitationToken: req.params.trackingToken
    });
    return res.redirect(`${frontendUrl.replace(/\/$/, '')}/register?${query}`);
  } catch (error) {
    console.error('Erreur tracking clic invitation:', error.message);
    return res.redirect(frontendUrl);
  }
});

router.post('/invitation-registered', authenticateToken, async (req, res) => {
  try {
    const verified = verifyTrackingToken(req.body.invitationToken);
    if (!verified) return res.status(400).json({ success: false, error: 'Invitation invalide ou expirée' });

    const invitation = await prisma.emailInvitation.findUnique({ where: { id: verified.invitationId } });
    if (!invitation || !req.user.email || invitation.email.toLowerCase() !== req.user.email.toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Cette invitation ne correspond pas au compte' });
    }

    await prisma.emailInvitation.update({
      where: { id: invitation.id },
      data: {
        registeredAt: new Date(),
        registeredUserId: req.user.id,
        status: 'REGISTERED'
      }
    });
    return res.json({ success: true, message: 'Conversion d\'invitation enregistrée' });
  } catch (error) {
    console.error('Erreur enregistrement conversion:', error.message);
    return res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

function anonymizeIP(ip) {
  if (!ip) return null;
  const normalized = ip.replace(/^::ffff:/, '');
  if (normalized.includes('.')) {
    const parts = normalized.split('.');
    return parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.0` : null;
  }
  if (normalized.includes(':')) return `${normalized.split(':').slice(0, 4).join(':')}::`;
  return null;
}

module.exports = router;
