/**
 * Middleware pour restreindre l'accès aux requêtes localhost uniquement
 */

const localhostOnly = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  // Normaliser l'IP (enlever le préfixe IPv6 si présent)
  const normalizedIP = clientIP.replace(/^::ffff:/, '');
  
  // IPs autorisées pour localhost
  const allowedIPs = [
    '127.0.0.1',
    '::1',
    'localhost'
  ];
  
  // Vérifier si l'IP est localhost
  const isLocalhost = allowedIPs.includes(normalizedIP) || 
                     normalizedIP === '127.0.0.1' ||
                     normalizedIP === '::1' ||
                     normalizedIP.startsWith('127.') ||
                     req.hostname === 'localhost';
  
  if (!isLocalhost) {
    console.warn(`🚫 Tentative d'accès non autorisée à une route localhost depuis ${normalizedIP}`);
    return res.status(403).json({
      success: false,
      message: 'Accès refusé : cette route n\'est accessible qu\'en localhost'
    });
  }
  
  next();
};

module.exports = { localhostOnly };