const { calculateClassement, calculateClassementJunior, getDuelisteStats, recalculateAllStats } = require('../services/classementService');
const { prisma } = require('../database');
const { PUBLIC_DUELLISTE_SELECT } = require('../utils/safeData');

// Vue anonyme du classement : uniquement ce qu'un tableau de classement affiche.
// On retire notamment l'identifiant (qui permettait d'énumérer les membres un à
// un) et les dates d'inscription, qui ne relèvent pas du classement.
const CLASSEMENT_PUBLIC_LIMIT_DEFAUT = 20;
const CLASSEMENT_PUBLIC_LIMIT_MAX = 100;

function versEntreePublique(entree) {
  return {
    rang: entree.rang,
    pseudo: entree.pseudo,
    avatarUrl: entree.avatarUrl,
    categorie: entree.categorie,
    nbVictoires: entree.nbVictoires,
    nbDefaites: entree.nbDefaites,
    totalPoints: entree.totalPoints
  };
}

/**
 * Applique le filtre minMatchs, la limite, puis — pour un appelant non
 * authentifié — la projection publique et un plafond de résultats.
 */
function prepareClassement(entrees, { limit, minMatchs }, utilisateur) {
  let resultat = entrees;

  const seuil = parseInt(minMatchs, 10);
  if (seuil > 0) {
    resultat = resultat
      .filter((dueliste) => dueliste.nbMatchsTotal >= seuil)
      .map((dueliste, index) => ({ ...dueliste, rang: index + 1 }));
  }

  const limiteDemandee = parseInt(limit, 10);
  const limiteValide = Number.isInteger(limiteDemandee) && limiteDemandee > 0 ? limiteDemandee : null;

  if (utilisateur) {
    return limiteValide ? resultat.slice(0, limiteValide) : resultat;
  }

  // Sans jeton, la liste est toujours bornée : elle ne doit pas servir d'annuaire.
  const limitePublique = Math.min(limiteValide || CLASSEMENT_PUBLIC_LIMIT_DEFAUT, CLASSEMENT_PUBLIC_LIMIT_MAX);
  return resultat.slice(0, limitePublique).map(versEntreePublique);
}

/**
 * Récupérer le classement général
 */
async function getClassement(req, res) {
  try {
    const { limit, minMatchs = 0 } = req.query;

    const classement = prepareClassement(await calculateClassement(), { limit, minMatchs }, req.user);

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

    const totaux = {
      duellistes: totalDuellistes,
      duellistesActifs,
      duels: totalDuels,
      duelsValides,
      duelsEnCours
    };

    // Sans jeton, on s'arrête aux compteurs agrégés : les records et l'activité
    // récente sont nominatifs et n'ont pas à être exposés publiquement.
    if (!req.user) {
      return res.json({ success: true, data: { totaux } });
    }

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
      },
      select: PUBLIC_DUELLISTE_SELECT
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
        totaux,
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

    const classementJunior = prepareClassement(
      await calculateClassementJunior(),
      { limit, minMatchs },
      req.user
    );

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
