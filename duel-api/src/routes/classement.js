const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');
const { handleValidation } = require('../middleware/validation');

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
router.get('/', validateQueryClassement, getClassement);
router.get('/junior', validateQueryClassement, getClassementJunior);
router.get('/stats/globales', getStatsGlobales);
router.get('/dueliste/:id', validateDuelisteId, getStatsDueliste);
router.post('/recalculer', recalculerStats); // Route admin

module.exports = router;