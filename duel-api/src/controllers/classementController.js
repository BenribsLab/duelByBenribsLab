const { calculateClassement, calculateClassementJunior, getDuelisteStats, recalculateAllStats } = require('../services/classementService');
const { prisma } = require('../database');

/**
 * Récupérer le classement général
 */
async function getClassement(req, res) {
  try {
    const { limit, minMatchs = 0 } = req.query;
    
    let classement = await calculateClassement();
    
    // Filtrer par nombre minimum de matchs si spécifié
    if (parseInt(minMatchs) > 0) {
      classement = classement.filter(dueliste => dueliste.nbMatchsTotal >= parseInt(minMatchs));
      
      // Recalculer les rangs après filtrage
      classement.forEach((dueliste, index) => {
        dueliste.rang = index + 1;
      });
    }
    
    // Limiter le nombre de résultats si spécifié
    if (limit && parseInt(limit) > 0) {
      classement = classement.slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      data: classement,
      meta: {
        total: classement.length,
        filtres: {
          minMatchs: parseInt(minMatchs) || 0,
          limit: limit ? parseInt(limit) : null
        }
      }
    });
    
  } catch (error) {
    console.error('Erreur getClassement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul du classement'
    });
  }
}

/**
 * Récupérer les statistiques détaillées d'un dueliste
 */
async function getStatsDueliste(req, res) {
  try {
    const { id } = req.params;
    
    const stats = await getDuelisteStats(parseInt(id));
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Erreur getStatsDueliste:', error);
    
    if (error.message === 'Dueliste non trouvé') {
      return res.status(404).json({
        success: false,
        error: 'Dueliste non trouvé'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques'
    });
  }
}

/**
 * Recalculer toutes les statistiques (admin seulement)
 */
async function recalculerStats(req, res) {
  try {
    const results = await recalculateAllStats();
    
    res.json({
      success: true,
      data: results,
      message: `Statistiques recalculées pour ${results.length} duellistes`
    });
    
  } catch (error) {
    console.error('Erreur recalculerStats:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du recalcul des statistiques'
    });
  }
}

/**
 * Obtenir les statistiques globales de l'application
 */
async function getStatsGlobales(req, res) {
  try {
    const [
      totalDuellistes,
      duellistesActifs,
      totalDuels,
      duelsValides,
      duelsEnCours
    ] = await Promise.all([
      prisma.dueliste.count(),
      prisma.dueliste.count({ where: { statut: 'ACTIF' } }),
      prisma.duel.count(),
      prisma.duel.count({ where: { etat: 'VALIDE' } }),
      prisma.duel.count({ 
        where: { 
          etat: { in: ['PROPOSE', 'ACCEPTE', 'A_JOUER', 'EN_ATTENTE_VALIDATION'] } 
        } 
      })
    ]);
    
    // Dueliste le plus actif
    const duelistePlusActif = await prisma.dueliste.findFirst({
      where: { statut: 'ACTIF' },
      orderBy: { nbMatchsTotal: 'desc' },
      select: { id: true, pseudo: true, nbMatchsTotal: true }
    });
    
    // Meilleur taux de victoire (minimum 5 matchs)
    const duellistes = await prisma.dueliste.findMany({
      where: { 
        statut: 'ACTIF',
        nbMatchsTotal: { gte: 5 }
      }
    });
    
    const meilleurTaux = duellistes.reduce((meilleur, dueliste) => {
      const taux = dueliste.nbVictoires / dueliste.nbMatchsTotal;
      const meilleurTauxActuel = meilleur ? meilleur.nbVictoires / meilleur.nbMatchsTotal : 0;
      
      return taux > meilleurTauxActuel ? dueliste : meilleur;
    }, null);
    
    // Duels récents
    const duelsRecents = await prisma.duel.findMany({
      where: { etat: 'VALIDE' },
      take: 5,
      orderBy: { dateValidation: 'desc' },
      include: {
        provocateur: { select: { pseudo: true } },
        adversaire: { select: { pseudo: true } }
      }
    });
    
    res.json({
      success: true,
      data: {
        totaux: {
          duellistes: totalDuellistes,
          duellistesActifs,
          duels: totalDuels,
          duelsValides,
          duelsEnCours
        },
        records: {
          duelistePlusActif,
          meilleurTauxVictoire: meilleurTaux ? {
            ...meilleurTaux,
            tauxVictoire: parseFloat((meilleurTaux.nbVictoires / meilleurTaux.nbMatchsTotal * 100).toFixed(2))
          } : null
        },
        activiteRecente: duelsRecents
      }
    });
    
  } catch (error) {
    console.error('Erreur getStatsGlobales:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques globales'
    });
  }
}

/**
 * Récupérer le classement Junior
 */
async function getClassementJunior(req, res) {
  try {
    const { limit, minMatchs = 0 } = req.query;
    
    let classementJunior = await calculateClassementJunior();
    
    // Filtrer par nombre minimum de matchs si spécifié
    if (parseInt(minMatchs) > 0) {
      classementJunior = classementJunior.filter(dueliste => dueliste.nbMatchsTotal >= parseInt(minMatchs));
      
      // Recalculer les rangs après filtrage
      classementJunior.forEach((dueliste, index) => {
        dueliste.rang = index + 1;
      });
    }
    
    // Limiter le nombre de résultats si spécifié
    if (limit && parseInt(limit) > 0) {
      classementJunior = classementJunior.slice(0, parseInt(limit));
    }
    
    res.json({
      success: true,
      data: classementJunior,
      message: `Classement Junior récupéré avec succès (${classementJunior.length} duellistes)`
    });
  } catch (error) {
    console.error('Erreur getClassementJunior:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du classement Junior'
    });
  }
}

module.exports = {
  getClassement,
  getClassementJunior,
  getStatsDueliste,
  recalculerStats,
  getStatsGlobales
};