const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
require('dotenv').config();

const { testConnection } = require('./database');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware de sécurité
app.use(helmet());

// Configuration CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate limiting (exclure les routes admin)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 requêtes par minute
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard.'
  },
  skip: (req) => {
    // Exclure les routes admin du rate limiting
    return req.path.startsWith('/api/admin/');
  }
});
app.use('/api/', limiter);

// Middleware de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logs
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Routes de base
app.get('/', (req, res) => {
  res.json({
    message: '🤺 Bienvenue sur l\'API Duel by Benribs Lab !',
    version: '1.0.0',
    status: 'active'
  });
});

// Route de santé pour Docker
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    docker: process.env.DOCKER_ENV === 'true'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Routes d'authentification
app.use('/api/auth', require('./routes/auth'));

// Routes d'authentification admin
app.use('/api/admin/auth', require('./routes/adminAuth'));

// Routes d'administration
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/duels', require('./routes/adminDuels'));
app.use('/api/admin/database', require('./routes/adminDatabase'));

// Routes API (à implémenter)
app.use('/api/duellistes', require('./routes/duellistes'));
app.use('/api/duels', require('./routes/duels'));
app.use('/api/classement', require('./routes/classement'));

// Middleware de gestion d'erreurs
app.use((err, req, res, _next) => {
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
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl
  });
});

// Démarrage du serveur
const server = app.listen(PORT, async () => {
  console.log(`🚀 Serveur API Duel démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  
  // Test de connexion à la base de données
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log('🗄️ Base de données SQLite connectée');
  } else {
    console.error('❌ Erreur de connexion à la base de données');
  }
});

// Gestion des arrêts propres
process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

module.exports = app;