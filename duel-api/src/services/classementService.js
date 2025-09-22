const { prisma } = require('../database');

/**
 * Calculer le classement général ou par catégorie
 * @param {string} categorie - Catégorie à filtrer (optionnel: 'JUNIOR', 'SENIOR')
 */
async function calculateClassement(categorie = null) {
  try {
    // Construire le filtre WHERE
    const whereClause = { statut: 'ACTIF' };
    if (categorie) {
      whereClause.categorie = categorie;
    }

    // Récupérer les duellistes avec leurs statistiques
    const duellistes = await prisma.dueliste.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            duelsProvoques: {
              where: { etat: 'VALIDE' }
            },
            duelsRecus: {
              where: { etat: 'VALIDE' }
            }
          }
        }
      }
    });
    
    // Calculer les données de classement pour chaque dueliste
    const classement = duellistes.map(dueliste => {
      const nbMatchsReel = dueliste._count.duelsProvoques + dueliste._count.duelsRecus;
      const tauxVictoire = nbMatchsReel > 0 ? (dueliste.nbVictoires / nbMatchsReel) : 0;
      
      // Système de points : 3 points par victoire + 1 point par défaite
      const totalPoints = (dueliste.nbVictoires * 3) + (dueliste.nbDefaites * 1);
      
      return {
        ...dueliste,
        nbMatchsReel,
        totalPoints,
        tauxVictoire: parseFloat((tauxVictoire * 100).toFixed(2)),
        efficacite: tauxVictoire, // Pour le tri
        _count: undefined // Nettoyer
      };
    });
    
    // Trier selon les critères hiérarchiques
    classement.sort((a, b) => {
      // 1. Total points (descendant) - encourage la participation
      if (a.totalPoints !== b.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      
      // 2. Nombre de victoires (descendant) - récompense la performance
      if (a.nbVictoires !== b.nbVictoires) {
        return b.nbVictoires - a.nbVictoires;
      }
      
      // 3. Indice touches (descendant) - départage final
      if (a.indiceTouches !== b.indiceTouches) {
        return b.indiceTouches - a.indiceTouches;
      }
      
      // 4. Pseudo alphabétique (ascendant)
      return a.pseudo.localeCompare(b.pseudo);
    });
    
    // Ajouter le rang
    return classement.map((dueliste, index) => ({
      ...dueliste,
      rang: index + 1
    }));
    
  } catch (error) {
    console.error('Erreur calculateClassement:', error);
    throw error;
  }
}

/**
 * Calculer le classement Junior spécifiquement
 */
async function calculateClassementJunior() {
  return await calculateClassement('JUNIOR');
}

/**
 * Recalculer les statistiques d'un dueliste
 */
async function recalculateStats(duelisteId) {
  try {
    // Récupérer tous les duels validés du dueliste
    const duels = await prisma.duel.findMany({
      where: {
        AND: [
          {
            OR: [
              { provocateurId: duelisteId },
              { adversaireId: duelisteId }
            ]
          },
          { etat: 'VALIDE' }
        ]
      }
    });
    
    let nbVictoires = 0;
    let nbDefaites = 0;
    let touchesDonnees = 0;
    let touchesRecues = 0;
    
    duels.forEach(duel => {
      const estProvocateur = duel.provocateurId === duelisteId;
      const scoreJoueur = estProvocateur ? duel.scoreProvocateur : duel.scoreAdversaire;
      const scoreAdversaire = estProvocateur ? duel.scoreAdversaire : duel.scoreProvocateur;
      
      // Compter victoires/défaites
      if (duel.vainqueurId === duelisteId) {
        nbVictoires++;
      } else {
        nbDefaites++;
      }
      
      // Calculer l'indice touches (plafonné à ±5 par duel)
      // const diffTouches = scoreJoueur - scoreAdversaire;
      // const indiceDuel = Math.max(-5, Math.min(5, diffTouches)); // TODO: utiliser pour calcul avancé
      
      touchesDonnees += scoreJoueur;
      touchesRecues += scoreAdversaire;
    });
    
    const nbMatchsTotal = nbVictoires + nbDefaites;
    const indiceTouches = touchesDonnees - touchesRecues;
    
    // Mettre à jour les statistiques
    await prisma.dueliste.update({
      where: { id: duelisteId },
      data: {
        nbVictoires,
        nbDefaites,
        nbMatchsTotal,
        indiceTouches
      }
    });
    
    return {
      nbVictoires,
      nbDefaites,
      nbMatchsTotal,
      indiceTouches,
      tauxVictoire: nbMatchsTotal > 0 ? (nbVictoires / nbMatchsTotal * 100) : 0
    };
    
  } catch (error) {
    console.error('Erreur recalculateStats:', error);
    throw error;
  }
}

/**
 * Recalculer toutes les statistiques
 */
async function recalculateAllStats() {
  try {
    const duellistes = await prisma.dueliste.findMany({
      select: { id: true }
    });
    
    const results = [];
    for (const dueliste of duellistes) {
      const stats = await recalculateStats(dueliste.id);
      results.push({ duelisteId: dueliste.id, ...stats });
    }
    
    return results;
  } catch (error) {
    console.error('Erreur recalculateAllStats:', error);
    throw error;
  }
}

/**
 * Obtenir les statistiques détaillées d'un dueliste
 */
async function getDuelisteStats(duelisteId) {
  try {
    const dueliste = await prisma.dueliste.findUnique({
      where: { id: duelisteId }
    });
    
    if (!dueliste) {
      throw new Error('Dueliste non trouvé');
    }
    
    // Historique des duels
    const duels = await prisma.duel.findMany({
      where: {
        AND: [
          {
            OR: [
              { provocateurId: duelisteId },
              { adversaireId: duelisteId }
            ]
          },
          { etat: 'VALIDE' }
        ]
      },
      include: {
        provocateur: { select: { id: true, pseudo: true } },
        adversaire: { select: { id: true, pseudo: true } }
      },
      orderBy: { dateValidation: 'desc' }
    });
    
    // Statistiques par adversaire
    const adversaireStats = {};
    
    duels.forEach(duel => {
      const estProvocateur = duel.provocateurId === duelisteId;
      const adversaire = estProvocateur ? duel.adversaire : duel.provocateur;
      const aGagne = duel.vainqueurId === duelisteId;
      
      if (!adversaireStats[adversaire.id]) {
        adversaireStats[adversaire.id] = {
          adversaire,
          victoires: 0,
          defaites: 0,
          total: 0
        };
      }
      
      adversaireStats[adversaire.id].total++;
      if (aGagne) {
        adversaireStats[adversaire.id].victoires++;
      } else {
        adversaireStats[adversaire.id].defaites++;
      }
    });
    
    // Série actuelle (victoires/défaites consécutives)
    const serieActuelle = { type: null, count: 0 };
    if (duels.length > 0) {
      const dernierResultat = duels[0].vainqueurId === duelisteId ? 'victoire' : 'defaite';
      serieActuelle.type = dernierResultat;
      serieActuelle.count = 1;
      
      for (let i = 1; i < duels.length; i++) {
        const resultat = duels[i].vainqueurId === duelisteId ? 'victoire' : 'defaite';
        if (resultat === dernierResultat) {
          serieActuelle.count++;
        } else {
          break;
        }
      }
    }
    
    return {
      dueliste,
      historiqueComplet: duels,
      adversaireStats: Object.values(adversaireStats),
      serieActuelle,
      tauxVictoire: dueliste.nbMatchsTotal > 0 ? 
        parseFloat((dueliste.nbVictoires / dueliste.nbMatchsTotal * 100).toFixed(2)) : 0
    };
    
  } catch (error) {
    console.error('Erreur getDuelisteStats:', error);
    throw error;
  }
}

module.exports = {
  calculateClassement,
  calculateClassementJunior,
  recalculateStats,
  recalculateAllStats,
  getDuelisteStats
};