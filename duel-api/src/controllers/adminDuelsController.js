const { prisma } = require('../database');

/**
 * Récupérer tous les duels pour l'admin (avec pagination et filtres)
 */
async function getAllDuelsAdmin(req, res) {
  try {
    const { 
      page = 1, 
      limit = 20, 
      etat, 
      provocateurId, 
      adversaireId,
      search 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Construction du filtre
    const where = {};
    
    if (etat) {
      where.etat = etat.toUpperCase();
    }
    
    if (provocateurId) {
      where.provocateurId = parseInt(provocateurId);
    }
    
    if (adversaireId) {
      where.adversaireId = parseInt(adversaireId);
    }
    
    // Recherche par pseudo
    if (search) {
      where.OR = [
        {
          provocateur: {
            pseudo: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          adversaire: {
            pseudo: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    // Récupération avec pagination
    const [duels, total] = await Promise.all([
      prisma.duel.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          provocateur: { 
            select: { 
              id: true, 
              pseudo: true, 
              avatarUrl: true,
              email: true 
            } 
          },
          adversaire: { 
            select: { 
              id: true, 
              pseudo: true, 
              avatarUrl: true,
              email: true 
            } 
          },
          arbitre: { 
            select: { 
              id: true, 
              pseudo: true, 
              avatarUrl: true 
            } 
          },
          validations: {
            include: {
              dueliste: {
                select: { id: true, pseudo: true }
              }
            }
          }
        }
      }),
      prisma.duel.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        duels,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Erreur getAllDuelsAdmin:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des duels'
    });
  }
}

/**
 * Supprimer un duel (admin seulement)
 */
async function supprimerDuel(req, res) {
  try {
    const { id } = req.params;
    const { raison } = req.body;

    const duel = await prisma.duel.findUnique({
      where: { id: parseInt(id) },
      include: {
        provocateur: { select: { id: true, pseudo: true } },
        adversaire: { select: { id: true, pseudo: true } }
      }
    });

    if (!duel) {
      return res.status(404).json({
        success: false,
        error: 'Duel non trouvé'
      });
    }

    // Supprimer les validations liées
    await prisma.validationScore.deleteMany({
      where: { matchId: parseInt(id) }
    });

    // Supprimer le duel
    await prisma.duel.delete({
      where: { id: parseInt(id) }
    });

    // Log de l'action admin
    console.log(`Admin suppression - Duel ${id} supprimé. Raison: ${raison || 'Non spécifiée'}`);

    res.json({
      success: true,
      message: 'Duel supprimé avec succès',
      data: {
        duelSupprime: {
          id: duel.id,
          provocateur: duel.provocateur,
          adversaire: duel.adversaire,
          etat: duel.etat
        },
        raison
      }
    });
  } catch (error) {
    console.error('Erreur supprimerDuel:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression du duel'
    });
  }
}

/**
 * Forcer la validation d'un duel avec un score (admin seulement)
 */
async function forcerValidationDuel(req, res) {
  try {
    const { id } = req.params;
    const { scoreProvocateur, scoreAdversaire, raison } = req.body;

    const duel = await prisma.duel.findUnique({
      where: { id: parseInt(id) },
      include: {
        provocateur: { select: { id: true, pseudo: true } },
        adversaire: { select: { id: true, pseudo: true } }
      }
    });

    if (!duel) {
      return res.status(404).json({
        success: false,
        error: 'Duel non trouvé'
      });
    }

    if (duel.etat === 'VALIDE') {
      return res.status(400).json({
        success: false,
        error: 'Ce duel est déjà validé'
      });
    }

    // Vérifications des scores
    if (scoreProvocateur === scoreAdversaire) {
      return res.status(400).json({
        success: false,
        error: 'Les scores ne peuvent pas être égaux (pas de match nul)'
      });
    }

    if (scoreProvocateur < 0 || scoreAdversaire < 0) {
      return res.status(400).json({
        success: false,
        error: 'Les scores ne peuvent pas être négatifs'
      });
    }

    const vainqueurId = scoreProvocateur > scoreAdversaire ? duel.provocateurId : duel.adversaireId;

    // Supprimer les validations existantes
    await prisma.validationScore.deleteMany({
      where: { matchId: parseInt(id) }
    });

    // Forcer la validation
    const duelValide = await prisma.duel.update({
      where: { id: parseInt(id) },
      data: {
        etat: 'VALIDE',
        scoreProvocateur: parseInt(scoreProvocateur),
        scoreAdversaire: parseInt(scoreAdversaire),
        vainqueurId,
        valideParArbitre: true,
        dateValidation: new Date(),
        notes: `Validation forcée par admin. Raison: ${raison || 'Non spécifiée'}`
      },
      include: {
        provocateur: { select: { id: true, pseudo: true, avatarUrl: true } },
        adversaire: { select: { id: true, pseudo: true, avatarUrl: true } },
        arbitre: { select: { id: true, pseudo: true, avatarUrl: true } }
      }
    });

    // Recalculer les statistiques
    await recalculateStats(duel.provocateurId);
    await recalculateStats(duel.adversaireId);

    // Log de l'action admin
    console.log(`Admin validation forcée - Duel ${id}: ${scoreProvocateur}-${scoreAdversaire}. Raison: ${raison || 'Non spécifiée'}`);

    res.json({
      success: true,
      message: 'Duel validé avec succès par l\'administrateur',
      data: duelValide
    });
  } catch (error) {
    console.error('Erreur forcerValidationDuel:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la validation forcée du duel'
    });
  }
}

/**
 * Obtenir les statistiques des duels pour l'admin
 */
async function getStatistiquesDuels(req, res) {
  try {
    const stats = await prisma.duel.groupBy({
      by: ['etat'],
      _count: {
        etat: true
      }
    });

    const totalDuels = await prisma.duel.count();
    const duelsConflits = await prisma.duel.count({
      where: { etat: 'EN_ATTENTE_VALIDATION' }
    });
    const duelsProposition = await prisma.duel.count({
      where: { etat: 'PROPOSE_SCORE' }
    });

    res.json({
      success: true,
      data: {
        total: totalDuels,
        parEtat: stats.reduce((acc, stat) => {
          acc[stat.etat] = stat._count.etat;
          return acc;
        }, {}),
        conflits: duelsConflits,
        propositions: duelsProposition
      }
    });
  } catch (error) {
    console.error('Erreur getStatistiquesDuels:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
}

// Fonction utilitaire pour recalculer les stats (importée du contrôleur principal)
async function recalculateStats(duelisteId) {
  try {
    const duelsValides = await prisma.duel.findMany({
      where: {
        etat: 'VALIDE',
        OR: [
          { provocateurId: duelisteId },
          { adversaireId: duelisteId }
        ]
      }
    });

    let victoires = 0;
    let defaites = 0;
    let indiceTouches = 0;

    duelsValides.forEach(duel => {
      if (duel.vainqueurId === duelisteId) {
        victoires++;
      } else {
        defaites++;
      }

      if (duel.provocateurId === duelisteId) {
        indiceTouches += duel.scoreProvocateur || 0;
      } else {
        indiceTouches += duel.scoreAdversaire || 0;
      }
    });

    await prisma.dueliste.update({
      where: { id: duelisteId },
      data: {
        nbVictoires: victoires,
        nbDefaites: defaites,
        nbMatchsTotal: duelsValides.length,
        indiceTouches
      }
    });
  } catch (error) {
    console.error(`Erreur recalcul stats ${duelisteId}:`, error);
  }
}

module.exports = {
  getAllDuelsAdmin,
  supprimerDuel,
  forcerValidationDuel,
  getStatistiquesDuels
};