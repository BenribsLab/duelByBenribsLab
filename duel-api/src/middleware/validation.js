const { validationResult } = require('express-validator');

/**
 * Middleware pour gérer les erreurs de validation
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Données invalides',
      details: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
}

/**
 * Middleware pour vérifier qu'un utilisateur est authentifié
 * (À implémenter plus tard avec JWT)
 */
function requireAuth(req, res, next) {
  // Pour l'instant, on laisse passer tout le monde
  // TODO: Implémenter la vérification JWT
  next();
}

/**
 * Middleware pour vérifier les permissions admin
 * (À implémenter plus tard)
 */
function requireAdmin(req, res, next) {
  // Pour l'instant, on laisse passer tout le monde
  // TODO: Implémenter la vérification des rôles
  next();
}

/**
 * Middleware pour logger les requêtes importantes
 */
function logImportantActions(action) {
  return (req, res, next) => {
    console.log(`🔍 Action: ${action} - IP: ${req.ip} - Time: ${new Date().toISOString()}`);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log('📝 Body:', JSON.stringify(req.body, null, 2));
    }
    next();
  };
}

/**
 * Middleware de limitation de taux pour actions sensibles
 */
function sensitiveActionLimit(req, res, next) {
  // Pour l'instant, on laisse passer
  // TODO: Implémenter une limitation plus stricte pour certaines actions
  next();
}

module.exports = {
  handleValidation,
  requireAuth,
  requireAdmin,
  logImportantActions,
  sensitiveActionLimit
};