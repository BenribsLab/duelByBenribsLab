const { prisma } = require('../database');
const { recalculateStats } = require('../services/classementService');
const pushNotificationService = require('../services/pushNotificationService');

/**
 * Récupérer tous les duels
 */
async function getAllDuels(req, res) {
  try {
    const { etat, duelisteId, page = 1, limit = 20 } = req.query;
    
    const where = {};
    
    // Filtrer par état si spécifié
    if (etat) {
      where.etat = etat.toUpperCase();
    }
    
    // Filtrer par dueliste si spécifié
    if (duelisteId) {
      where.OR = [
        { provocateurId: parseInt(duelisteId) },
        { adversaireId: parseInt(duelisteId) }
      ];
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [duels, total] = await Promise.all([
      prisma.duel.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          provocateur: { select: { id: true, pseudo: true, avatarUrl: true } },
          adversaire: { select: { id: true, pseudo: true, avatarUrl: true } },
          arbitre: { select: { id: true, pseudo: true, avatarUrl: true } }
        }
      }),
      prisma.duel.count({ where })
    ]);
    
    res.json({
      success: true,
      data: duels,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur getAllDuels:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des duels'
    });
  }
}

/**
 * Récupérer un duel par ID
 */
async function getDuelById(req, res) {
  try {
    const { id } = req.params;
    
    const duel = await prisma.duel.findUnique({
      where: { id: parseInt(id) },
      include: {
        provocateur: { select: { id: true, pseudo: true, avatarUrl: true } },
        adversaire: { select: { id: true, pseudo: true, avatarUrl: true } },
        arbitre: { select: { id: true, pseudo: true, avatarUrl: true } },
        validations: {
          include: {
            dueliste: { select: { id: true, pseudo: true } }
          }
        }
      }
    });
    
    if (!duel) {
      return res.status(404).json({
        success: false,
        error: 'Duel non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: duel
    });
  } catch (error) {
    console.error('Erreur getDuelById:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du duel'
    });
  }
}

/**
 * Proposer un nouveau duel
 */
async function proposerDuel(req, res) {
  try {
    const { provocateurId, adversaireId, arbitreId, dateProgrammee, notes } = req.body;
    
    // Vérifications de base
    if (provocateurId === adversaireId) {
      return res.status(400).json({
        success: false,
        error: 'Un dueliste ne peut pas se défier lui-même'
      });
    }
    
    // Vérifier que les duellistes existent
    const [provocateur, adversaire] = await Promise.all([
      prisma.dueliste.findUnique({ where: { id: provocateurId } }),
      prisma.dueliste.findUnique({ where: { id: adversaireId } })
    ]);
    
    if (!provocateur || !adversaire) {
      return res.status(404).json({
        success: false,
        error: 'Un ou plusieurs duellistes non trouvés'
      });
    }
    
    // Vérifier que les duellistes sont actifs
    if (provocateur.statut !== 'ACTIF' || adversaire.statut !== 'ACTIF') {
      return res.status(400).json({
        success: false,
        error: 'Seuls les duellistes actifs peuvent participer à des duels'
      });
    }
    
    // Vérifier qu'il n'y a pas déjà un duel actif entre ces deux joueurs
    // (on permet plusieurs propositions, mais pas plusieurs duels acceptés)
    const duelExistant = await prisma.duel.findFirst({
      where: {
        OR: [
          {
            provocateurId,
            adversaireId,
            etat: { in: ['ACCEPTE', 'A_JOUER', 'EN_ATTENTE_VALIDATION'] }
          },
          {
            provocateurId: adversaireId,
            adversaireId: provocateurId,
            etat: { in: ['ACCEPTE', 'A_JOUER', 'EN_ATTENTE_VALIDATION'] }
          }
        ]
      }
    });
    
    if (duelExistant) {
      return res.status(400).json({
        success: false,
        error: 'Un duel est déjà accepté ou en cours entre ces deux duellistes'
      });
    }
    
    const data = {
      provocateurId,
      adversaireId,
      notes: notes || null
    };
    
    if (arbitreId) {
      const arbitre = await prisma.dueliste.findUnique({ where: { id: arbitreId } });
      if (!arbitre) {
        return res.status(404).json({
          success: false,
          error: 'Arbitre non trouvé'
        });
      }
      data.arbitreId = arbitreId;
    }
    
    if (dateProgrammee) {
      data.dateProgrammee = new Date(dateProgrammee);
    }
    
    const nouveauDuel = await prisma.duel.create({
      data,
      include: {
        provocateur: { select: { id: true, pseudo: true, avatarUrl: true, pushToken: true } },
        adversaire: { select: { id: true, pseudo: true, avatarUrl: true, pushToken: true } },
        arbitre: { select: { id: true, pseudo: true, avatarUrl: true } }
      }
    });

    // Envoyer notification push à l'adversaire
    if (nouveauDuel.adversaire.pushToken) {
      try {
        const notification = pushNotificationService.createInvitationNotification(
          nouveauDuel.provocateur,
          nouveauDuel.adversaire
        );
        
        await pushNotificationService.sendNotification(
          nouveauDuel.adversaire.pushToken,
          notification,
          notification.data
        );
      } catch (error) {
        console.error('Erreur notification push invitation:', error);
        // Ne pas faire échouer la création du duel pour une erreur de notification
      }
    }
    
    res.status(201).json({
      success: true,
      data: nouveauDuel,
      message: 'Duel proposé avec succès'
    });
  } catch (error) {
    console.error('Erreur proposerDuel:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la proposition du duel'
    });
  }
}

/**
 * Accepter un duel
 */
async function accepterDuel(req, res) {
  try {
    const { id } = req.params;
    const { adversaireId, dateProgrammee } = req.body;
    
    const duel = await prisma.duel.findUnique({
      where: { id: parseInt(id) },
      include: {
        provocateur: { select: { id: true, pseudo: true, pushToken: true } },
        adversaire: { select: { id: true, pseudo: true, pushToken: true } }
      }
    });
    
    if (!duel) {
      return res.status(404).json({
        success: false,
        error: 'Duel non trouvé'
      });
    }
    
    if (duel.etat !== 'PROPOSE') {
      return res.status(400).json({
        success: false,
        error: 'Ce duel ne peut plus être accepté'
      });
    }
    
    if (duel.adversaireId !== adversaireId) {
      return res.status(403).json({
        success: false,
        error: 'Seul l\'adversaire peut accepter ce duel'
      });
    }
    
    const updateData = {
      etat: 'A_JOUER',
      dateAcceptation: new Date()
    };
    
    if (dateProgrammee) {
      updateData.dateProgrammee = new Date(dateProgrammee);
    }
    
    const duelAccepte = await prisma.duel.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        provocateur: { select: { id: true, pseudo: true, avatarUrl: true, pushToken: true } },
        adversaire: { select: { id: true, pseudo: true, avatarUrl: true, pushToken: true } },
        arbitre: { select: { id: true, pseudo: true, avatarUrl: true } }
      }
    });

    // Envoyer notification push au provocateur
    if (duelAccepte.provocateur.pushToken) {
      try {
        const notification = pushNotificationService.createAcceptedNotification(
          duelAccepte.adversaire,
          duelAccepte.provocateur
        );
        
        await pushNotificationService.sendNotification(
          duelAccepte.provocateur.pushToken,
          notification,
          notification.data
        );
      } catch (error) {
        console.error('Erreur notification push acceptation:', error);
      }
    }
    
    res.json({
      success: true,
      data: duelAccepte,
      message: 'Duel accepté avec succès'
    });
  } catch (error) {
    console.error('Erreur accepterDuel:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'acceptation du duel'
    });
  }
}

/**
 * Refuser un duel
 */
async function refuserDuel(req, res) {
  try {
    const { id } = req.params;
    const { adversaireId, raison } = req.body;
    
    const duel = await prisma.duel.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!duel) {
      return res.status(404).json({
        success: false,
        error: 'Duel non trouvé'
      });
    }
    
    if (duel.etat !== 'PROPOSE') {
      return res.status(400).json({
        success: false,
        error: 'Ce duel ne peut plus être refusé'
      });
    }
    
    if (duel.adversaireId !== adversaireId) {
      return res.status(403).json({
        success: false,
        error: 'Seul l\'adversaire peut refuser ce duel'
      });
    }
    
    const duelRefuse = await prisma.duel.update({
      where: { id: parseInt(id) },
      data: {
        etat: 'REFUSE',
        notes: raison ? `Refusé: ${raison}` : 'Refusé'
      },
      include: {
        provocateur: { select: { id: true, pseudo: true, avatarUrl: true } },
        adversaire: { select: { id: true, pseudo: true, avatarUrl: true } }
      }
    });
    
    res.json({
      success: true,
      data: duelRefuse,
      message: 'Duel refusé'
    });
  } catch (error) {
    console.error('Erreur refuserDuel:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du refus du duel'
    });
  }
}

/**
 * Saisir le score d'un duel
 */
async function saisirScore(req, res) {
  try {
    const { id } = req.params;
    const { duelisteId, scoreProvocateur, scoreAdversaire } = req.body;
    
    const duel = await prisma.duel.findUnique({
      where: { id: parseInt(id) },
      include: {
        provocateur: { select: { id: true, pseudo: true, pushToken: true } },
        adversaire: { select: { id: true, pseudo: true, pushToken: true } },
        arbitre: { select: { id: true } },
        validations: true
      }
    });
    
    if (!duel) {
      return res.status(404).json({
        success: false,
        error: 'Duel non trouvé'
      });
    }
    
    if (!['A_JOUER', 'EN_ATTENTE_VALIDATION', 'PROPOSE_SCORE'].includes(duel.etat)) {
      return res.status(400).json({
        success: false,
        error: 'Ce duel n\'est pas dans un état permettant la saisie de score'
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
    
    // Vérifier que la personne a le droit de saisir
    const peutSaisir = duel.provocateurId === duelisteId || 
                       duel.adversaireId === duelisteId || 
                       duel.arbitreId === duelisteId;
    
    if (!peutSaisir) {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'avez pas l\'autorisation de saisir le score de ce duel'
      });
    }
    
    // Si c'est l'arbitre qui saisit, validation immédiate
    if (duel.arbitreId === duelisteId) {
      const vainqueurId = scoreProvocateur > scoreAdversaire ? duel.provocateurId : duel.adversaireId;
      
      const duelValide = await prisma.duel.update({
        where: { id: parseInt(id) },
        data: {
          etat: 'VALIDE',
          scoreProvocateur,
          scoreAdversaire,
          vainqueurId,
          valideParArbitre: true,
          dateValidation: new Date()
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

      // Envoyer notifications push de fin de duel
      try {
        const scoreText = `${scoreProvocateur}-${scoreAdversaire}`;
        const notifications = pushNotificationService.createFinishedNotification(
          vainqueurId === duel.provocateurId ? duel.provocateur : duel.adversaire,
          vainqueurId === duel.provocateurId ? duel.adversaire : duel.provocateur,
          scoreText
        );

        // Notification au vainqueur
        const vainqueur = vainqueurId === duel.provocateurId ? duel.provocateur : duel.adversaire;
        if (vainqueur.pushToken) {
          await pushNotificationService.sendNotification(
            vainqueur.pushToken,
            notifications.victory,
            notifications.victory.data
          );
        }

        // Notification au perdant
        const perdant = vainqueurId === duel.provocateurId ? duel.adversaire : duel.provocateur;
        if (perdant.pushToken) {
          await pushNotificationService.sendNotification(
            perdant.pushToken,
            notifications.defeat,
            notifications.defeat.data
          );
        }
      } catch (error) {
        console.error('Erreur notifications push fin de duel:', error);
      }
      
      return res.json({
        success: true,
        data: duelValide,
        message: 'Score validé par l\'arbitre'
      });
    }
    
    // Sinon, système de double validation
    // Cas 1: Premier à proposer un score (duel était en A_JOUER)
    if (duel.etat === 'A_JOUER') {
      // Vérifier qu'il n'y a pas déjà une validation de ce joueur
      const validationExistante = await prisma.validationScore.findUnique({
        where: {
          matchId_duelisteId: {
            matchId: parseInt(id),
            duelisteId
          }
        }
      });
      
      if (validationExistante) {
        return res.status(400).json({
          success: false,
          error: 'Vous avez déjà saisi le score pour ce duel'
        });
      }
      
      // Créer la validation et passer en PROPOSE_SCORE
      await prisma.validationScore.create({
        data: {
          matchId: parseInt(id),
          duelisteId,
          scoreProvocateur,
          scoreAdversaire
        }
      });
      
      await prisma.duel.update({
        where: { id: parseInt(id) },
        data: { 
          etat: 'PROPOSE_SCORE',
          scoreProvocateur,
          scoreAdversaire
        }
      });

      // Envoyer notification push à l'autre joueur
      try {
        const autreJoueur = duelisteId === duel.provocateurId ? duel.adversaire : duel.provocateur;
        const saisisseur = duelisteId === duel.provocateurId ? duel.provocateur : duel.adversaire;
        
        if (autreJoueur.pushToken) {
          const notification = pushNotificationService.createScoreNotification(saisisseur, autreJoueur);
          await pushNotificationService.sendNotification(
            autreJoueur.pushToken,
            notification,
            notification.data
          );
        }
      } catch (error) {
        console.error('Erreur notification push proposition score:', error);
      }
      
      return res.json({
        success: true,
        message: 'Score proposé. En attente de validation par l\'autre joueur',
        proposedBy: duelisteId
      });
    }
    
    // Cas 2: Réponse à une proposition existante (duel était en PROPOSE_SCORE)
    if (duel.etat === 'PROPOSE_SCORE') {
      // Vérifier que c'est bien l'autre joueur qui répond
      const validationProposante = await prisma.validationScore.findFirst({
        where: { matchId: parseInt(id) }
      });
      
      if (validationProposante && validationProposante.duelisteId === duelisteId) {
        return res.status(400).json({
          success: false,
          error: 'Vous avez déjà proposé un score. Attendez la réponse de l\'autre joueur.'
        });
      }
      
      // Vérifier si le score proposé correspond à celui déjà saisi
      const scoreIdentique = (
        duel.scoreProvocateur === scoreProvocateur && 
        duel.scoreAdversaire === scoreAdversaire
      );
      
      if (scoreIdentique) {
        // Acceptation de la proposition -> validation immédiate
        const vainqueurId = scoreProvocateur > scoreAdversaire ? duel.provocateurId : duel.adversaireId;
        
        // Créer la deuxième validation
        await prisma.validationScore.create({
          data: {
            matchId: parseInt(id),
            duelisteId,
            scoreProvocateur,
            scoreAdversaire
          }
        });
        
        const duelValide = await prisma.duel.update({
          where: { id: parseInt(id) },
          data: {
            etat: 'VALIDE',
            scoreProvocateur,
            scoreAdversaire,
            vainqueurId,
            valideParProvocateur: true,
            valideParAdversaire: true,
            dateValidation: new Date()
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

        // Envoyer notifications push de fin de duel
        try {
          const scoreText = `${scoreProvocateur}-${scoreAdversaire}`;
          const notifications = pushNotificationService.createFinishedNotification(
            vainqueurId === duel.provocateurId ? duel.provocateur : duel.adversaire,
            vainqueurId === duel.provocateurId ? duel.adversaire : duel.provocateur,
            scoreText
          );

          // Notification au vainqueur
          const vainqueur = vainqueurId === duel.provocateurId ? duel.provocateur : duel.adversaire;
          if (vainqueur.pushToken) {
            await pushNotificationService.sendNotification(
              vainqueur.pushToken,
              notifications.victory,
              notifications.victory.data
            );
          }

          // Notification au perdant
          const perdant = vainqueurId === duel.provocateurId ? duel.adversaire : duel.provocateur;
          if (perdant.pushToken) {
            await pushNotificationService.sendNotification(
              perdant.pushToken,
              notifications.defeat,
              notifications.defeat.data
            );
          }
        } catch (error) {
          console.error('Erreur notifications push fin de duel validé:', error);
        }
        
        return res.json({
          success: true,
          data: duelValide,
          message: 'Score accepté et validé automatiquement'
        });
      } else {
        // Contre-proposition -> effacer l'ancienne validation et créer une nouvelle
        await prisma.validationScore.deleteMany({
          where: { matchId: parseInt(id) }
        });
        
        await prisma.validationScore.create({
          data: {
            matchId: parseInt(id),
            duelisteId,
            scoreProvocateur,
            scoreAdversaire
          }
        });
        
        await prisma.duel.update({
          where: { id: parseInt(id) },
          data: { 
            etat: 'PROPOSE_SCORE',
            scoreProvocateur,
            scoreAdversaire
          }
        });

        // Envoyer notification push à l'autre joueur pour la contre-proposition
        try {
          const autreJoueur = duelisteId === duel.provocateurId ? duel.adversaire : duel.provocateur;
          const saisisseur = duelisteId === duel.provocateurId ? duel.provocateur : duel.adversaire;
          
          if (autreJoueur.pushToken) {
            const notification = pushNotificationService.createScoreNotification(saisisseur, autreJoueur);
            await pushNotificationService.sendNotification(
              autreJoueur.pushToken,
              notification,
              notification.data
            );
          }
        } catch (error) {
          console.error('Erreur notification push contre-proposition:', error);
        }
        
        return res.json({
          success: true,
          message: 'Contre-proposition de score envoyée. En attente de validation par l\'autre joueur',
          proposedBy: duelisteId
        });
      }
    }
    
    // Cas 3: Gestion des conflits (état EN_ATTENTE_VALIDATION)
    if (duel.etat === 'EN_ATTENTE_VALIDATION') {
      return res.status(400).json({
        success: false,
        error: 'Ce duel est en conflit de scores. Un arbitre doit intervenir.'
      });
    }
    
  } catch (error) {
    console.error('Erreur saisirScore:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la saisie du score'
    });
  }
}

/**
 * Récupérer la proposition de score en cours
 */
async function getPropositionScore(req, res) {
  try {
    const { id } = req.params;
    const { duelisteId } = req.query;
    
    const duel = await prisma.duel.findUnique({
      where: { id: parseInt(id) },
      include: {
        provocateur: { select: { id: true, pseudo: true } },
        adversaire: { select: { id: true, pseudo: true } },
        validations: {
          include: {
            dueliste: { select: { id: true, pseudo: true } }
          }
        }
      }
    });
    
    if (!duel) {
      return res.status(404).json({
        success: false,
        error: 'Duel non trouvé'
      });
    }
    
    if (duel.etat !== 'PROPOSE_SCORE') {
      return res.status(400).json({
        success: false,
        error: 'Aucune proposition de score en cours pour ce duel'
      });
    }
    
    // Vérifier que la personne a le droit de voir
    const peutVoir = duel.provocateurId === parseInt(duelisteId) || 
                     duel.adversaireId === parseInt(duelisteId);
    
    if (!peutVoir) {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'avez pas l\'autorisation de voir cette proposition'
      });
    }
    
    // Trouver qui a proposé
    const validation = duel.validations[0];
    const aPropose = validation.duelisteId === parseInt(duelisteId);
    
    return res.json({
      success: true,
      data: {
        duelId: duel.id,
        etat: duel.etat,
        scoreProvocateur: duel.scoreProvocateur,
        scoreAdversaire: duel.scoreAdversaire,
        provocateur: duel.provocateur,
        adversaire: duel.adversaire,
        proposePar: validation.dueliste,
        aPropose,
        peutRepondre: !aPropose
      }
    });
  } catch (error) {
    console.error('Erreur getPropositionScore:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la proposition'
    });
  }
}

/**
 * Accepter la proposition de score de l'autre joueur
 */
async function accepterPropositionScore(req, res) {
  try {
    const { id } = req.params;
    const { duelisteId } = req.body;
    
    const duel = await prisma.duel.findUnique({
      where: { id: parseInt(id) },
      include: {
        validations: true
      }
    });
    
    if (!duel) {
      return res.status(404).json({
        success: false,
        error: 'Duel non trouvé'
      });
    }
    
    if (duel.etat !== 'PROPOSE_SCORE') {
      return res.status(400).json({
        success: false,
        error: 'Aucune proposition de score à accepter'
      });
    }
    
    // Vérifier que c'est bien l'autre joueur qui accepte
    const validationExistante = duel.validations.find(v => v.duelisteId === duelisteId);
    if (validationExistante) {
      return res.status(400).json({
        success: false,
        error: 'Vous avez déjà proposé un score. Vous ne pouvez pas accepter votre propre proposition.'
      });
    }
    
    // Vérifier que la personne a le droit d'accepter
    const peutAccepter = duel.provocateurId === duelisteId || duel.adversaireId === duelisteId;
    if (!peutAccepter) {
      return res.status(403).json({
        success: false,
        error: 'Vous n\'avez pas l\'autorisation d\'accepter cette proposition'
      });
    }
    
    // Accepter en créant une validation identique
    await prisma.validationScore.create({
      data: {
        matchId: parseInt(id),
        duelisteId,
        scoreProvocateur: duel.scoreProvocateur,
        scoreAdversaire: duel.scoreAdversaire
      }
    });
    
    // Valider le duel
    const vainqueurId = duel.scoreProvocateur > duel.scoreAdversaire ? duel.provocateurId : duel.adversaireId;
    
    const duelValide = await prisma.duel.update({
      where: { id: parseInt(id) },
      data: {
        etat: 'VALIDE',
        vainqueurId,
        valideParProvocateur: true,
        valideParAdversaire: true,
        dateValidation: new Date()
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
    
    return res.json({
      success: true,
      data: duelValide,
      message: 'Proposition de score acceptée et duel validé'
    });
  } catch (error) {
    console.error('Erreur accepterPropositionScore:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'acceptation de la proposition'
    });
  }
}

module.exports = {
  getAllDuels,
  getDuelById,
  proposerDuel,
  accepterDuel,
  refuserDuel,
  saisirScore,
  getPropositionScore,
  accepterPropositionScore
};