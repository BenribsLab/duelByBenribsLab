const { prisma } = require('../database');
// const { calculateClassement } = require('../services/classementService'); // TODO: utiliser ou supprimer

/**
 * Récupérer tous les duellistes
 */
async function getAllDuellistes(req, res) {
  try {
    const { statut, search, page = 1, limit = 20 } = req.query;
    
    const where = {};
    
    // Filtrer par statut si spécifié
    if (statut) {
      where.statut = statut.toUpperCase();
    }
    
    // Recherche par pseudo
    if (search) {
      where.pseudo = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [duellistes, total] = await Promise.all([
      prisma.dueliste.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: [
          { nbVictoires: 'desc' },
          { pseudo: 'asc' }
        ],
        include: {
          _count: {
            select: {
              duelsProvoques: true,
              duelsRecus: true
            }
          }
        }
      }),
      prisma.dueliste.count({ where })
    ]);
    
    res.json({
      success: true,
      data: duellistes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur getAllDuellistes:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des duellistes'
    });
  }
}

/**
 * Récupérer un dueliste par ID
 */
async function getDuelisteById(req, res) {
  try {
    const { id } = req.params;
    
    const dueliste = await prisma.dueliste.findUnique({
      where: { id: parseInt(id) },
      include: {
        duelsProvoques: {
          include: {
            adversaire: { select: { id: true, pseudo: true } },
            arbitre: { select: { id: true, pseudo: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        duelsRecus: {
          include: {
            provocateur: { select: { id: true, pseudo: true } },
            arbitre: { select: { id: true, pseudo: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!dueliste) {
      return res.status(404).json({
        success: false,
        error: 'Dueliste non trouvé'
      });
    }
    
    // Calculer le taux de victoire
    const tauxVictoire = dueliste.nbMatchsTotal > 0 
      ? (dueliste.nbVictoires / dueliste.nbMatchsTotal * 100).toFixed(1)
      : 0;
    
    res.json({
      success: true,
      data: {
        ...dueliste,
        tauxVictoire: parseFloat(tauxVictoire),
        historiqueRecent: [
          ...dueliste.duelsProvoques,
          ...dueliste.duelsRecus
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Erreur getDuelisteById:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du dueliste'
    });
  }
}

/**
 * Créer un nouveau dueliste
 */
async function createDueliste(req, res) {
  try {
    const { pseudo, avatarUrl, categorie } = req.body;
    
    // Vérifier que le pseudo n'existe pas déjà
    const existant = await prisma.dueliste.findUnique({
      where: { pseudo }
    });
    
    if (existant) {
      return res.status(400).json({
        success: false,
        error: 'Ce pseudo est déjà utilisé'
      });
    }

    const nouveauDueliste = await prisma.dueliste.create({
      data: {
        pseudo,
        avatarUrl: avatarUrl || null,
        categorie: categorie || 'SENIOR' // Par défaut SENIOR, peut être JUNIOR
      }
    });    res.status(201).json({
      success: true,
      data: nouveauDueliste,
      message: 'Dueliste créé avec succès'
    });
  } catch (error) {
    console.error('Erreur createDueliste:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du dueliste'
    });
  }
}

/**
 * Mettre à jour un dueliste
 */
async function updateDueliste(req, res) {
  try {
    const { id } = req.params;
    const { pseudo, avatarUrl, statut, categorie } = req.body;
    
    // Vérifier que le dueliste existe
    const existant = await prisma.dueliste.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existant) {
      return res.status(404).json({
        success: false,
        error: 'Dueliste non trouvé'
      });
    }
    
    // Si changement de pseudo, vérifier l'unicité
    if (pseudo && pseudo !== existant.pseudo) {
      const pseudoExistant = await prisma.dueliste.findUnique({
        where: { pseudo }
      });
      
      if (pseudoExistant) {
        return res.status(400).json({
          success: false,
          error: 'Ce pseudo est déjà utilisé'
        });
      }
    }
    
    const updateData = {};
    if (pseudo) updateData.pseudo = pseudo;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (statut) updateData.statut = statut.toUpperCase();
    if (categorie) updateData.categorie = categorie.toUpperCase();
    
    const duelisteModifie = await prisma.dueliste.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    
    res.json({
      success: true,
      data: duelisteModifie,
      message: 'Dueliste modifié avec succès'
    });
  } catch (error) {
    console.error('Erreur updateDueliste:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la modification du dueliste'
    });
  }
}

/**
 * Supprimer un dueliste
 */
async function deleteDueliste(req, res) {
  try {
    const { id } = req.params;
    
    // Vérifier que le dueliste existe
    const existant = await prisma.dueliste.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existant) {
      return res.status(404).json({
        success: false,
        error: 'Dueliste non trouvé'
      });
    }
    
    // Vérifier qu'il n'a pas de duels en cours
    const duelsEnCours = await prisma.duel.count({
      where: {
        OR: [
          { provocateurId: parseInt(id) },
          { adversaireId: parseInt(id) }
        ],
        etat: {
          in: ['PROPOSE', 'ACCEPTE', 'A_JOUER', 'EN_ATTENTE_VALIDATION']
        }
      }
    });
    
    if (duelsEnCours > 0) {
      return res.status(400).json({
        success: false,
        error: 'Impossible de supprimer un dueliste avec des duels en cours'
      });
    }
    
    await prisma.dueliste.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({
      success: true,
      message: 'Dueliste supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteDueliste:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du dueliste'
    });
  }
}

/**
 * Marquer les notifications comme consultées
 */
async function markNotificationsAsRead(req, res) {
  try {
    const duelisteId = parseInt(req.params.id);
    const userId = req.user.id; // Depuis le middleware auth
    
    // Vérifier que l'utilisateur modifie ses propres données
    if (duelisteId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez marquer que vos propres notifications comme lues'
      });
    }
    
    // Vérifier que le duelliste existe
    const dueliste = await prisma.dueliste.findUnique({
      where: { id: duelisteId }
    });
    
    if (!dueliste) {
      return res.status(404).json({
        success: false,
        message: 'Duelliste introuvable'
      });
    }
    
    // Mettre à jour la date de dernière consultation
    const now = new Date();
    await prisma.dueliste.update({
      where: { id: duelisteId },
      data: { derniereConsultationNotifications: now }
    });
    
    res.json({
      success: true,
      message: 'Notifications marquées comme consultées',
      data: {
        duelisteId: duelisteId,
        derniereConsultationNotifications: now
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour des notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des notifications'
    });
  }
}

module.exports = {
  getAllDuellistes,
  getDuelisteById,
  createDueliste,
  updateDueliste,
  deleteDueliste,
  markNotificationsAsRead
};