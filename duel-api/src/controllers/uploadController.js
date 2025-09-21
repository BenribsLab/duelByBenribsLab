const { prisma } = require('../database');
const { deleteAvatarFile, getAvatarUrl, getFilenameFromUrl } = require('../middleware/upload');

/**
 * Upload d'un avatar
 * POST /api/upload/avatar
 */
async function uploadAvatar(req, res) {
  try {
    // Vérifier qu'un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Aucun fichier fourni'
      });
    }

    // Récupérer l'ID de l'utilisateur depuis le token d'authentification
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié'
      });
    }

    // Récupérer l'ancien avatar de l'utilisateur pour le supprimer
    const user = await prisma.dueliste.findUnique({
      where: { id: userId },
      select: { avatarUrl: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Générer l'URL publique du nouvel avatar
    const avatarUrl = getAvatarUrl(req.file.filename);

    // Mettre à jour l'avatar de l'utilisateur en base de données
    await prisma.dueliste.update({
      where: { id: userId },
      data: { avatarUrl: avatarUrl }
    });

    // Supprimer l'ancien fichier avatar s'il existe
    if (user.avatarUrl) {
      const oldFilename = getFilenameFromUrl(user.avatarUrl);
      if (oldFilename) {
        deleteAvatarFile(oldFilename);
      }
    }

    res.json({
      success: true,
      data: {
        avatarUrl: avatarUrl,
        filename: req.file.filename,
        size: req.file.size
      },
      message: 'Avatar uploadé avec succès'
    });

  } catch (error) {
    console.error('Erreur uploadAvatar:', error);
    
    // En cas d'erreur, supprimer le fichier uploadé
    if (req.file) {
      deleteAvatarFile(req.file.filename);
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'upload de l\'avatar'
    });
  }
}

/**
 * Supprimer l'avatar d'un utilisateur
 * DELETE /api/upload/avatar
 */
async function deleteAvatar(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Utilisateur non authentifié'
      });
    }

    // Récupérer l'avatar actuel de l'utilisateur
    const user = await prisma.dueliste.findUnique({
      where: { id: userId },
      select: { avatarUrl: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    // Supprimer l'avatar de la base de données
    await prisma.dueliste.update({
      where: { id: userId },
      data: { avatarUrl: null }
    });

    // Supprimer le fichier physique
    if (user.avatarUrl) {
      const filename = getFilenameFromUrl(user.avatarUrl);
      if (filename) {
        deleteAvatarFile(filename);
      }
    }

    res.json({
      success: true,
      message: 'Avatar supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur deleteAvatar:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de l\'avatar'
    });
  }
}

module.exports = {
  uploadAvatar,
  deleteAvatar
};