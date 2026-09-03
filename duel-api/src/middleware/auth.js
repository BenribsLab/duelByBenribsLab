const authService = require('../services/authService');

// Middleware pour vérifier l'authentification
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const match = typeof authHeader === 'string' ? authHeader.match(/^Bearer\s+([^\s]+)$/i) : null;
    const token = match && match[1];

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
    return res.status(401).json({
      success: false,
      error: 'Token invalide ou expiré'
    });
  }
};

// Middleware optionnel (ne bloque pas si pas de token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const match = typeof authHeader === 'string' ? authHeader.match(/^Bearer\s+([^\s]+)$/i) : null;
    const token = match && match[1];

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
