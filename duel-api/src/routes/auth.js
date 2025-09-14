const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { body } = require('express-validator');
const validation = require('../middleware/validation');

const router = express.Router();

// Route d'inscription
router.post('/register', [
  body('pseudo')
    .trim()
    .isLength({ min: 2, max: 30 })
    .matches(/^[a-zA-Z0-9À-ÿ_-]+$/)
    .withMessage('Le pseudo doit contenir entre 2 et 30 caractères (lettres, chiffres, _, -)'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Format d\'email invalide'),
  
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  
  body('authMode')
    .optional()
    .isIn(['PASSWORD', 'OTP'])
    .withMessage('Mode d\'authentification invalide'),
  
  body('hasEmailAccess')
    .optional()
    .isBoolean()
    .withMessage('hasEmailAccess doit être un booléen'),
  
  validation.handleValidation,
], authController.register);

// Route de connexion
router.post('/login', [
  body('pseudo')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Pseudo invalide'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Format d\'email invalide'),
  
  body('password')
    .optional()
    .custom((value, { _req }) => {
      // Si un mot de passe est fourni, il doit avoir au moins 1 caractère
      if (value !== undefined && value !== null && value !== '' && value.length < 1) {
        throw new Error('Mot de passe trop court');
      }
      return true;
    }),
  
  validation.handleValidation,
], authController.login);

// Route de vérification OTP
router.post('/verify-otp', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Format d\'email invalide'),
  
  body('otpCode')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Code OTP invalide (6 chiffres requis)'),
  
  validation.handleValidation,
], authController.verifyOTP);

// Route pour récupérer le profil (nécessite authentification)
router.get('/me', authenticateToken, authController.getProfile);

// Route de déconnexion
router.post('/logout', authController.logout);

module.exports = router;