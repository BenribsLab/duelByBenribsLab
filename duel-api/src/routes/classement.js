const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');
const { handleValidation } = require('../middleware/validation');
const { authenticateAdmin } = require('../middleware/adminAuth');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const {
  getClassement,
  getClassementJunior,
  getStatsDueliste,
  recalculerStats,
  getStatsGlobales
} = require('../controllers/classementController');

// Validation pour les paramètres de requête
const validateQueryClassement = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
  
  query('minMatchs')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Le minimum de matchs doit être un entier positif ou nul'),
  
  handleValidation
];

// Validation pour l'ID de dueliste
const validateDuelisteId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID du dueliste doit être un entier positif'),
  
  handleValidation
];

// Routes
//
// Le classement reste consultable sans compte : c'est un affichage public,
// notamment via le shortcode WordPress du site du club. `optionalAuth` permet
// de servir une vue réduite (rang, pseudo, avatar, V/D, points) aux visiteurs
// anonymes, et la vue complète aux applications authentifiées.
router.get('/', optionalAuth, validateQueryClassement, getClassement);
router.get('/junior', optionalAuth, validateQueryClassement, getClassementJunior);

// Compteurs agrégés en accès libre ; records et activité récente, qui sont
// nominatifs, réservés aux utilisateurs authentifiés.
router.get('/stats/globales', optionalAuth, getStatsGlobales);

// Le détail d'un membre n'est pas de la donnée de classement : il exige un compte.
router.get('/dueliste/:id', authenticateToken, validateDuelisteId, getStatsDueliste);

router.post('/recalculer', authenticateAdmin, recalculerStats);

module.exports = router;
