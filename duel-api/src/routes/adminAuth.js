const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const { authenticateAdmin } = require('../middleware/adminAuth');
const { adminLoginLimiter } = require('../middleware/securityRateLimits');
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validation');

/**
 * POST /api/admin/auth/login - Connexion administrateur
 */
router.post('/login', adminLoginLimiter, [
  body('username').isString().trim().isLength({ min: 1, max: 80 }),
  body('password').isString().isLength({ min: 1, max: 128 }),
  handleValidation
], adminAuthController.login);

/**
 * POST /api/admin/auth/verify - Vérifier le token admin
 */
router.post('/verify', authenticateAdmin, adminAuthController.verifyToken);

/**
 * POST /api/admin/auth/change-password - Changer le mot de passe admin
 */

/**
 * POST /api/admin/auth/logout - Déconnexion admin
 */
router.post('/logout', authenticateAdmin, adminAuthController.logout);

module.exports = router;
