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
  
  // Vérifier si l'IP est localhost OU si c'est une requête interne du serveur
  const isLocalhost = allowedIPs.includes(normalizedIP) || 
                     normalizedIP === '127.0.0.1' ||
                     normalizedIP === '::1' ||
                     normalizedIP.startsWith('127.') ||
                     req.hostname === 'localhost' ||
                     // Accepter les requêtes depuis le même serveur (Docker interne)
                     normalizedIP.startsWith('172.') || // Docker bridge network
                     normalizedIP.startsWith('10.') ||  // Docker internal networks
                     // Si la requête vient avec les bons headers (reverse proxy)
                     req.headers['x-forwarded-for'] === '127.0.0.1' ||
                     // Ou si c'est le serveur qui se contacte lui-même
                     req.headers.host?.includes('localhost') ||
                     req.headers.host?.includes('127.0.0.1');
  
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