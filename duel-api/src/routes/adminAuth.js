const express = require('express');
const router = express.Router();
const adminAuthController = require('../controllers/adminAuthController');
const { authenticateAdmin } = require('../middleware/adminAuth');

/**
 * POST /api/admin/auth/login - Connexion administrateur
 */
router.post('/login', adminAuthController.login);

/**
 * POST /api/admin/auth/verify - Vérifier le token admin
 */
router.post('/verify', authenticateAdmin, adminAuthController.verifyToken);

/**
 * POST /api/admin/auth/change-password - Changer le mot de passe admin
 */
router.post('/change-password', authenticateAdmin, adminAuthController.changePassword);

/**
 * POST /api/admin/auth/logout - Déconnexion admin
 */
router.post('/logout', authenticateAdmin, adminAuthController.logout);

module.exports = router;