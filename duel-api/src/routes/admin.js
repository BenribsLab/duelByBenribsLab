const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/adminAuth');
const { body, param, query } = require('express-validator');
const validation = require('../middleware/validation');

const router = express.Router();

// Middleware d'authentification admin pour toutes les routes
router.use(authenticateAdmin);

/**
 * Routes de gestion des utilisateurs
 */

// GET /api/admin/users - Lister les utilisateurs avec pagination
router.get('/users', [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un entier positif'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
  
  validation.handleValidation,
], adminController.getUsers);

// GET /api/admin/search - Rechercher des utilisateurs
router.get('/search', [
  query('q')
    .notEmpty()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Terme de recherche requis'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un entier positif'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('La limite doit être entre 1 et 50'),
  
  validation.handleValidation,
], adminController.searchUsers);

// GET /api/admin/stats - Statistiques des utilisateurs
router.get('/stats', adminController.getStats);

// GET /api/admin/users/:id - Obtenir un utilisateur par ID
router.get('/users/:id', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID utilisateur invalide'),
  
  validation.handleValidation,
], adminController.getUserById);

// PUT /api/admin/users/:id - Mettre à jour un utilisateur
router.put('/users/:id', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID utilisateur invalide'),
  
  body('pseudo')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .matches(/^[a-zA-Z0-9À-ÿ_-]+$/)
    .withMessage('Le pseudo doit contenir entre 2 et 30 caractères (lettres, chiffres, _, -)'),
  
  body('email')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '') return true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    })
    .withMessage('Format d\'email invalide'),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  
  body('authMode')
    .optional()
    .isIn(['PASSWORD', 'OTP'])
    .withMessage('Mode d\'authentification invalide'),
  
  validation.handleValidation,
], adminController.updateUser);

// DELETE /api/admin/users/:id - Supprimer un utilisateur
router.delete('/users/:id', [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID utilisateur invalide'),
  
  validation.handleValidation,
], adminController.deleteUser);

// DELETE /api/admin/users - Supprimer plusieurs utilisateurs
router.delete('/users', [
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('Liste d\'IDs utilisateurs requise'),
  
  body('userIds.*')
    .isInt({ min: 1 })
    .withMessage('Chaque ID doit être un entier positif'),
  
  validation.handleValidation,
], adminController.deleteMultipleUsers);

module.exports = router;