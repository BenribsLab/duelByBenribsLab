// Configuration pour l'app mobile
const config = {
  // URL de l'API - pointant vers votre API en production
  API_BASE_URL: 'https://api-duel.benribs.fr/api',
  
  // Configuration spécifique mobile
  MOBILE_CONFIG: {
    enableNativeFeatures: true,
    offlineMode: false,
    debugMode: process.env.NODE_ENV === 'development'
  }
};

export default config;