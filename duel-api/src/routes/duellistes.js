const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const {
  getAllDuellistes,
  getDuelisteById,
  createDueliste,
  updateDueliste,
  deleteDueliste
} = require('../controllers/duellistesController');

// Validation middleware pour la création
const validateCreateDueliste = [
  body('pseudo')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le pseudo doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-Z0-9\s.\-_]+$/)
    .withMessage('Le pseudo ne peut contenir que des lettres, chiffres, espaces, points, tirets et underscores'),
  
  body('avatarUrl')
    .optional()
    .custom((value) => {
      // Accepter les URLs normales et les data URLs (base64)
      if (!value) return true; // Optionnel
      
      // Vérifier si c'est une data URL (base64)
      if (value.startsWith('data:image/')) {
        return true;
      }
      
      // Sinon, vérifier si c'est une URL valide
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('L\'URL de l\'avatar doit être une URL valide ou une image base64');
      }
    }),
  
  body('categorie')
    .optional()
    .isIn(['JUNIOR', 'SENIOR'])
    .withMessage('La catégorie doit être JUNIOR ou SENIOR'),
  
  handleValidation
];

// Validation middleware pour la mise à jour
const validateUpdateDueliste = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID doit être un entier positif'),
  
  body('pseudo')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le pseudo doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-Z0-9\s.\-_]+$/)
    .withMessage('Le pseudo ne peut contenir que des lettres, chiffres, espaces, points, tirets et underscores'),
  
  body('avatarUrl')
    .optional()
    .custom((value) => {
      // Accepter les URLs normales et les data URLs (base64)
      if (!value) return true; // Optionnel
      
      // Vérifier si c'est une data URL (base64)
      if (value.startsWith('data:image/')) {
        return true;
      }
      
      // Sinon, vérifier si c'est une URL valide
      try {
        new URL(value);
        return true;
      } catch {
        throw new Error('L\'URL de l\'avatar doit être une URL valide ou une image base64');
      }
    }),
  
  body('statut')
    .optional()
    .isIn(['ACTIF', 'INACTIF', 'SUSPENDU'])
    .withMessage('Le statut doit être ACTIF, INACTIF ou SUSPENDU'),
  
  body('categorie')
    .optional()
    .isIn(['JUNIOR', 'SENIOR'])
    .withMessage('La catégorie doit être JUNIOR ou SENIOR'),
  
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
  
  query('statut')
    .optional()
    .isIn(['ACTIF', 'INACTIF', 'SUSPENDU'])
    .withMessage('Le statut doit être ACTIF, INACTIF ou SUSPENDU'),
  
  handleValidation
];

// Routes
router.get('/', authenticateToken, validateQuery, getAllDuellistes);
router.get('/:id', authenticateToken, param('id').isInt({ min: 1 }).withMessage('L\'ID doit être un entier positif'), handleValidation, getDuelisteById);
router.post('/', authenticateToken, validateCreateDueliste, createDueliste);
router.put('/:id', authenticateToken, validateUpdateDueliste, updateDueliste);
router.delete('/:id', authenticateToken, param('id').isInt({ min: 1 }).withMessage('L\'ID doit être un entier positif'), handleValidation, deleteDueliste);

module.exports = router;