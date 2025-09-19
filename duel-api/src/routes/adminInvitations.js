const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateAdmin } = require('../middleware/adminAuth');

const prisma = new PrismaClient();

/**
 * GET /api/admin/invitations
 * Récupérer toutes les invitations avec filtres et pagination
 */
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      dateFrom,
      dateTo,
      inviterId
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Construire les filtres
    const where = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { recipientName: { contains: search, mode: 'insensitive' } },
        { inviter: { pseudo: { contains: search, mode: 'insensitive' } } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (inviterId) {
      where.inviterId = parseInt(inviterId);
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Compter le total
    const total = await prisma.emailInvitation.count({ where });

    // Récupérer les invitations
    const invitations = await prisma.emailInvitation.findMany({
      where,
      include: {
        inviter: {
          select: {
            id: true,
            pseudo: true,
            email: true
          }
        },
        registeredUser: {
          select: {
            id: true,
            pseudo: true,
            email: true,
            dateInscription: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: parseInt(limit)
    });

    // Calculer les métadonnées de pagination
    const totalPages = Math.ceil(total / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: invitations,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Erreur récupération invitations admin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

/**
 * GET /api/admin/invitations/stats
 * Récupérer les statistiques globales des invitations
 */
router.get('/stats', authenticateAdmin, async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;

    // Construire les filtres de date
    const dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.gte = new Date(dateFrom);
      if (dateTo) dateFilter.createdAt.lte = new Date(dateTo);
    }

    // Statistiques par statut
    const statusStats = await prisma.emailInvitation.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: {
        status: true
      }
    });

    // Statistiques globales
    const [
      totalInvitations,
      totalSent,
      totalOpened,
      totalClicked,
      totalRegistered
    ] = await Promise.all([
      prisma.emailInvitation.count({ where: dateFilter }),
      prisma.emailInvitation.count({ 
        where: { ...dateFilter, status: { not: 'PENDING' } }
      }),
      prisma.emailInvitation.count({ 
        where: { ...dateFilter, openedAt: { not: null } }
      }),
      prisma.emailInvitation.count({ 
        where: { ...dateFilter, clickedAt: { not: null } }
      }),
      prisma.emailInvitation.count({ 
        where: { ...dateFilter, registeredAt: { not: null } }
      })
    ]);

    // Taux de conversion
    const openRate = totalSent > 0 ? (totalOpened / totalSent * 100).toFixed(2) : 0;
    const clickRate = totalSent > 0 ? (totalClicked / totalSent * 100).toFixed(2) : 0;
    const conversionRate = totalSent > 0 ? (totalRegistered / totalSent * 100).toFixed(2) : 0;

    // Top inviteurs
    const topInviters = await prisma.emailInvitation.groupBy({
      by: ['inviterId'],
      where: dateFilter,
      _count: {
        inviterId: true
      },
      orderBy: {
        _count: {
          inviterId: 'desc'
        }
      },
      take: 10
    });

    // Enrichir les données des top inviteurs
    const enrichedTopInviters = await Promise.all(
      topInviters.map(async (item) => {
        const inviter = await prisma.dueliste.findUnique({
          where: { id: item.inviterId },
          select: { pseudo: true, email: true }
        });
        return {
          ...item,
          inviter,
          count: item._count.inviterId
        };
      })
    );

    // Activité récente (7 derniers jours)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentActivity = await prisma.emailInvitation.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        createdAt: true,
        status: true
      }
    });

    // Grouper par jour
    const dailyStats = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayKey = date.toISOString().split('T')[0];
      dailyStats[dayKey] = { sent: 0, opened: 0, clicked: 0, registered: 0 };
    }

    recentActivity.forEach(invitation => {
      const dayKey = invitation.createdAt.toISOString().split('T')[0];
      if (dailyStats[dayKey]) {
        dailyStats[dayKey].sent++;
      }
    });

    res.json({
      success: true,
      data: {
        global: {
          totalInvitations,
          totalSent,
          totalOpened,
          totalClicked,
          totalRegistered,
          openRate: parseFloat(openRate),
          clickRate: parseFloat(clickRate),
          conversionRate: parseFloat(conversionRate)
        },
        statusStats: statusStats.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {}),
        topInviters: enrichedTopInviters,
        dailyStats
      }
    });

  } catch (error) {
    console.error('Erreur récupération stats invitations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/admin/invitations/:id/resend
 * Renvoyer une invitation
 */
router.post('/:id/resend', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const emailService = require('../services/emailService');

    // Récupérer l'invitation
    const invitation = await prisma.emailInvitation.findUnique({
      where: { id: parseInt(id) },
      include: {
        inviter: {
          select: { pseudo: true }
        }
      }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation non trouvée'
      });
    }

    // Vérifier que l'invitation n'est pas déjà convertie
    if (invitation.status === 'REGISTERED') {
      return res.status(400).json({
        success: false,
        error: 'Impossible de renvoyer une invitation déjà convertie'
      });
    }

    // Envoyer l'email
    await emailService.sendInvitationEmail(
      invitation.email,
      invitation.inviter.pseudo,
      invitation.inviter.pseudo,
      invitation.recipientName,
      invitation.id
    );

    // Mettre à jour l'invitation
    await prisma.emailInvitation.update({
      where: { id: parseInt(id) },
      data: {
        status: 'SENT',
        reminderSentAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Invitation renvoyée avec succès'
    });

  } catch (error) {
    console.error('Erreur renvoi invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

/**
 * DELETE /api/admin/invitations/:id
 * Supprimer une invitation
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const invitation = await prisma.emailInvitation.findUnique({
      where: { id: parseInt(id) }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation non trouvée'
      });
    }

    await prisma.emailInvitation.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Invitation supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

/**
 * POST /api/admin/invitations/bulk-delete
 * Supprimer plusieurs invitations
 */
router.post('/bulk-delete', authenticateAdmin, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Liste d\'IDs requise'
      });
    }

    const result = await prisma.emailInvitation.deleteMany({
      where: {
        id: { in: ids.map(id => parseInt(id)) }
      }
    });

    res.json({
      success: true,
      message: `${result.count} invitation(s) supprimée(s) avec succès`,
      deletedCount: result.count
    });

  } catch (error) {
    console.error('Erreur suppression bulk invitations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
});

module.exports = router;