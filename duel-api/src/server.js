const app = require('./app');
const { testConnection, disconnect } = require('./database');
const pushNotificationService = require('./services/pushNotificationService');

const PORT = process.env.PORT || 3003;

// Démarrage du serveur
const server = app.listen(PORT, async () => {
  console.log(`🚀 Serveur API Duel démarré sur le port ${PORT}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);

  // Test de connexion à la base de données
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log('🗄️ Base de données connectée');
  } else {
    console.error('❌ Erreur de connexion à la base de données');
  }

  // Initialiser le service de push notifications
  pushNotificationService.init();
});

// Gestion des arrêts propres
const shutdown = () => {
  console.log('Arrêt du serveur...');
  server.close(async () => {
    await disconnect();
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = server;
