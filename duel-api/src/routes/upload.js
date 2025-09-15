const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');
const { uploadAvatar, deleteAvatar } = require('../controllers/uploadController');

/**
 * POST /api/upload/avatar - Upload d'un avatar
 * Middleware d'authentification requis
 */
router.post('/avatar', 
  authenticateToken,  // Vérifier que l'utilisateur est connecté
  upload,            // Middleware multer pour traiter l'upload
  handleUploadError, // Gestion des erreurs d'upload
  uploadAvatar       // Controller pour traiter l'upload
);

/**
 * DELETE /api/upload/avatar - Supprimer l'avatar
 * Middleware d'authentification requis
 */
router.delete('/avatar',
  authenticateToken,  // Vérifier que l'utilisateur est connecté
  deleteAvatar       // Controller pour supprimer l'avatar
);

module.exports = router;