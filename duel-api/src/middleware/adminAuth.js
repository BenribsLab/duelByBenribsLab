const adminAuthService = require('../services/adminAuthService');

/**
 * Middleware d'authentification admin
 */
const authenticateAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification admin requis'
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "
    
    const decoded = adminAuthService.verifyAdminToken(token);
    
    // Ajouter les infos admin à la requête
    req.admin = decoded;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message || 'Authentification admin échoué'
    });
  }
};

module.exports = {
  authenticateAdmin
};