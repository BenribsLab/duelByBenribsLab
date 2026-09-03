const localhostOnly = (req, res, next) => {
  const socketAddress = String(req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  const isLoopback = socketAddress === '::1' || socketAddress === '127.0.0.1' || socketAddress.startsWith('127.');

  if (!isLoopback) {
    console.warn(`Accès local refusé depuis ${socketAddress || 'adresse inconnue'}`);
    return res.status(403).json({
      success: false,
      message: 'Accès refusé : cette route est réservée à la boucle locale'
    });
  }
  return next();
};

module.exports = { localhostOnly };
