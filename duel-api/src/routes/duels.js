const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const {
  getAllDuels,
  getDuelById,
  proposerDuel,
  accepterDuel,
  refuserDuel,
  saisirScore,
  getPropositionScore,
  accepterPropositionScore
} = require('../controllers/duelsController');

// Validation pour la proposition de duel
const validateProposerDuel = [
  body('provocateurId')
    .isInt({ min: 1 })
    .withMessage('L\'ID du provocateur doit être un entier positif'),
  
  body('adversaireId')
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'adversaire doit être un entier positif'),
  
  body('arbitreId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'arbitre doit être un entier positif'),
  
  body('dateProgrammee')
    .optional()
    .isISO8601()
    .withMessage('La date programmée doit être au format ISO 8601'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Les notes ne peuvent pas dépasser 500 caractères'),
  
  handleValidation
];

// Validation pour l'acceptation de duel
const validateAccepterDuel = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du duel doit être un entier positif'),
  
  body('adversaireId')
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'adversaire doit être un entier positif'),
  
  body('dateProgrammee')
    .optional()
    .isISO8601()
    .withMessage('La date programmée doit être au format ISO 8601'),
  
  handleValidation
];

// Validation pour le refus de duel
const validateRefuserDuel = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du duel doit être un entier positif'),
  
  body('adversaireId')
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'adversaire doit être un entier positif'),
  
  body('raison')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('La raison ne peut pas dépasser 200 caractères'),
  
  handleValidation
];

// Validation pour la saisie de score
const validateSaisirScore = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du duel doit être un entier positif'),
  
  body('duelisteId')
    .isInt({ min: 1 })
    .withMessage('L\'ID du dueliste doit être un entier positif'),
  
  body('scoreProvocateur')
    .isInt({ min: 0, max: 50 })
    .withMessage('Le score du provocateur doit être entre 0 et 50'),
  
  body('scoreAdversaire')
    .isInt({ min: 0, max: 50 })
    .withMessage('Le score de l\'adversaire doit être entre 0 et 50'),
  
  // Validation personnalisée pour empêcher l'égalité
  body().custom((body) => {
    if (body.scoreProvocateur === body.scoreAdversaire) {
      throw new Error('Les scores ne peuvent pas être égaux (pas de match nul)');
    }
    return true;
  }),
  
  handleValidation
];

// Validation pour les paramètres de requête
const validateQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un entier positif'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
  
  query('etat')
    .optional()
    .isIn(['PROPOSE', 'ACCEPTE', 'REFUSE', 'A_JOUER', 'EN_ATTENTE_VALIDATION', 'VALIDE', 'ANNULE'])
    .withMessage('L\'état doit être valide'),
  
  query('duelisteId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID du dueliste doit être un entier positif'),
  
  handleValidation
];

// Routes principales
router.get('/', authenticateToken, validateQuery, getAllDuels);
router.get('/:id', authenticateToken, param('id').isInt({ min: 1 }).withMessage('L\'ID doit être un entier positif'), handleValidation, getDuelById);
router.post('/', authenticateToken, validateProposerDuel, proposerDuel);

// Actions sur les duels
router.put('/:id/accepter', authenticateToken, validateAccepterDuel, accepterDuel);
router.put('/:id/refuser', authenticateToken, validateRefuserDuel, refuserDuel);
router.put('/:id/score', authenticateToken, validateSaisirScore, saisirScore);
router.get('/:id/proposition', 
  authenticateToken,
  param('id').isInt({ min: 1 }).withMessage('L\'ID doit être un entier positif'),
  query('duelisteId').isInt({ min: 1 }).withMessage('L\'ID du duelliste doit être un entier positif'),
  handleValidation, 
  getPropositionScore
);
router.put('/:id/accepter-proposition',
  authenticateToken,
  param('id').isInt({ min: 1 }).withMessage('L\'ID doit être un entier positif'),
  body('duelisteId').isInt({ min: 1 }).withMessage('L\'ID du duelliste doit être un entier positif'),
  handleValidation,
  accepterPropositionScore
);

module.exports = router;