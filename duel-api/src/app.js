const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { safeJsonResponses } = require('./utils/safeData');
require('dotenv').config();
const { validateSecurityConfig } = require('./config/security');
validateSecurityConfig();

// Importer database.js pour initialiser la configuration dynamique
require('./database');

const app = express();

// Configuration trust proxy pour Docker/reverse proxy.
//
// Sans cette configuration, `req.ip` vaut l'adresse du dernier relais et non
// celle du client : toutes les requetes arrivant par le proxy partagent alors
// le meme compteur de limitation de debit. Dix echecs de connexion suffiraient
// a verrouiller la connexion de tous les utilisateurs.
//
// TRUSTED_PROXIES accepte soit un nombre de relais a traverser (recommande :
// 1 si l'API est directement derriere un seul proxy), soit une liste d'IP/CIDR.
const trustedProxiesSetting = (process.env.TRUSTED_PROXIES || '').trim();
const hopCount = /^\d+$/.test(trustedProxiesSetting) ? Number(trustedProxiesSetting) : null;
const trustedProxyList = trustedProxiesSetting
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

if (hopCount !== null) {
  app.set('trust proxy', hopCount);
} else if (trustedProxyList.length > 0) {
  app.set('trust proxy', trustedProxyList);
} else {
  app.set('trust proxy', false);
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      "ATTENTION: TRUSTED_PROXIES n'est pas defini. Derriere un reverse proxy, " +
      "la limitation de debit s'applique globalement au lieu de s'appliquer par client, " +
      'ce qui permet a un seul attaquant de bloquer tous les utilisateurs.'
    );
  }
}

// Middleware de sécurité
app.use(helmet());

// Configuration CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS ?
  process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3003', 'http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Servir les fichiers statiques (uploads) avec headers de protection
app.use('/uploads', (req, res, next) => {
  res.header('Cross-Origin-Resource-Policy', 'same-site');
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('Content-Security-Policy', "default-src 'none'; sandbox");
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Rate limiting global
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard.'
  }
});
app.use('/api/', limiter);

// Middleware de parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(safeJsonResponses);

// Logs
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { skip: (req) => req.path.startsWith('/api/track/') }));
}

// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: '🤺 Bienvenue sur l\'API Duel by Benribs Lab !',
    status: 'active'
  });
});

// Route de santé pour Docker
const health = (req, res) => res.json({ status: 'healthy' });
app.get('/api/health', health);
app.get('/health', health);

// Routes d'authentification
app.use('/api/auth', require('./routes/auth'));

// Routes d'authentification admin
app.use('/api/admin/auth', require('./routes/adminAuth'));

// Routes d'administration
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/duels', require('./routes/adminDuels'));
app.use('/api/admin/database', require('./routes/adminDatabase'));
app.use('/api/admin/invitations', require('./routes/adminInvitations'));

// Routes API
app.use('/api/duellistes', require('./routes/duellistes'));
app.use('/api/duels', require('./routes/duels'));
app.use('/api/classement', require('./routes/classement'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/users', require('./routes/users'));
app.use('/api/invitations', require('./routes/invitations'));
app.use('/api/track', require('./routes/tracking'));
app.use('/api/parental-consent', require('./routes/parentalConsent'));

// Middleware de gestion d'erreurs
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('Erreur:', err);

  if (err.type === 'validation') {
    return res.status(400).json({
      error: 'Données invalides',
      details: err.details
    });
  }

  res.status(500).json({
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// Route 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl
  });
});

module.exports = app;
