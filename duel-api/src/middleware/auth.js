const authService = require('../services/authService');

// Middleware pour vérifier l'authentification
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'accès requis'
      });
    }

    const user = await authService.getUserFromToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Token invalide ou expiré'
    });
  }
};

// Middleware optionnel (ne bloque pas si pas de token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const user = await authService.getUserFromToken(token);
      req.user = user;
    }
    next();
  } catch (error) {
    // Ignorer les erreurs et continuer sans utilisateur
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};