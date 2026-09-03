const { prisma } = require('../database');

/**
 * POST /api/users/:id/push-token - Enregistrer ou mettre à jour le token FCM d'un utilisateur
 */
const updatePushToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { pushToken, platform } = req.body;

    // Vérifier que l'utilisateur existe
    const user = await prisma.dueliste.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }

    // Vérifier que l'utilisateur connecté peut modifier ce token
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({
        error: 'Accès non autorisé'
      });
    }

    // Mettre à jour le token
    const updatedUser = await prisma.dueliste.update({
      where: { id: parseInt(id) },
      data: { 
        pushToken: pushToken,
        updatedAt: new Date()
      }
    });

    console.log(`Token FCM mis à jour pour l'utilisateur ${user.id}`);

    res.json({
      success: true,
      message: 'Token FCM enregistré avec succès',
      data: {
        userId: updatedUser.id,
        platform: platform || 'web'
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du token FCM:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
};

/**
 * DELETE /api/users/:id/push-token - Supprimer le token FCM d'un utilisateur
 */
const deletePushToken = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier que l'utilisateur connecté peut modifier ce token
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({
        error: 'Accès non autorisé'
      });
    }

    // Supprimer le token
    await prisma.dueliste.update({
      where: { id: parseInt(id) },
      data: { 
        pushToken: null,
        updatedAt: new Date()
      }
    });

    console.log(`📱 Token FCM supprimé pour l'utilisateur ${id}`);

    res.json({
      success: true,
      message: 'Token FCM supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du token FCM:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur est survenue'
    });
  }
};

module.exports = {
  updatePushToken,
  deletePushToken
};
