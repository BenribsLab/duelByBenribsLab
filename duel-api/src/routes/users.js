const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { handleValidation } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const {
  updatePushToken,
  deletePushToken
} = require('../controllers/usersController');

/**
 * POST /api/users/:id/push-token - Enregistrer ou mettre à jour le token FCM
 */
router.post('/:id/push-token', [
  authenticateToken,
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
  body('pushToken')
    .notEmpty()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Le token FCM est requis et doit être valide'),
  body('platform')
    .optional()
    .isIn(['web', 'android', 'ios'])
    .withMessage('La plateforme doit être web, android ou ios'),
  handleValidation
], updatePushToken);

/**
 * DELETE /api/users/:id/push-token - Supprimer le token FCM
 */
router.delete('/:id/push-token', [
  authenticateToken,
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID utilisateur doit être un entier positif'),
  handleValidation
], deletePushToken);

module.exports = router;