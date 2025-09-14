const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../middleware/validation');
const { authenticateAdmin } = require('../middleware/adminAuth');

const {
  getAllDuelsAdmin,
  supprimerDuel,
  forcerValidationDuel,
  getStatistiquesDuels
} = require('../controllers/adminDuelsController');

// Middleware admin pour toutes les routes
router.use(authenticateAdmin);

// Validation pour la suppression de duel
const validateSupprimerDuel = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID doit être un entier positif'),
  body('raison')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La raison ne doit pas dépasser 500 caractères'),
  handleValidation
];

// Validation pour la validation forcée
const validateForcerValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID doit être un entier positif'),
  body('scoreProvocateur')
    .isInt({ min: 0, max: 50 })
    .withMessage('Le score du provocateur doit être entre 0 et 50'),
  body('scoreAdversaire')
    .isInt({ min: 0, max: 50 })
    .withMessage('Le score de l\'adversaire doit être entre 0 et 50'),
  body('raison')
    .optional()
    .isLength({ max: 500 })
    .withMessage('La raison ne doit pas dépasser 500 caractères'),
  // Validation personnalisée pour éviter les égalités
  body().custom((body) => {
    if (body.scoreProvocateur === body.scoreAdversaire) {
      throw new Error('Les scores ne peuvent pas être égaux (pas de match nul)');
    }
    return true;
  }),
  handleValidation
];

// Validation pour les filtres de recherche
const validateQueryAdmin = [
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
    .isIn(['PROPOSE', 'ACCEPTE', 'A_JOUER', 'PROPOSE_SCORE', 'EN_ATTENTE_VALIDATION', 'VALIDE'])
    .withMessage('État invalide'),
  query('provocateurId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID du provocateur doit être un entier positif'),
  query('adversaireId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('L\'ID de l\'adversaire doit être un entier positif'),
  query('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('La recherche ne doit pas dépasser 100 caractères'),
  handleValidation
];

// Routes principales
router.get('/', validateQueryAdmin, getAllDuelsAdmin);
router.get('/statistiques', getStatistiquesDuels);

// Actions d'administration
router.delete('/:id', validateSupprimerDuel, supprimerDuel);
router.put('/:id/forcer-validation', validateForcerValidation, forcerValidationDuel);

module.exports = router;