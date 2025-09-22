# 📱 Duel by Benribs Lab - Application Mobile

Application mobile native développée avec React et Capacitor pour la gestion de duels d'escrime. Cette app mobile offre une interface utilisateur optimisée pour smartphones avec authentification automatique, gestion des duellistes, organisation de duels, et notifications push.

## ✨ Fonctionnalités principales

### 📱 Interface Mobile Native
- **Capacitor Framework** : Application hybride déployée sur Android
- **Design mobile-first** : Interface React optimisée pour smartphones
- **Navigation tactile** : Menu mobile avec gestion du bouton retour Android
- **Performance mobile** : Bundle optimisé pour appareils mobiles
- **Écran de démarrage** : SplashScreen pendant le chargement

### 🔐 Authentification Automatique Mobile
- **JWT Automatique** : Intercepteur Axios qui ajoute automatiquement le token utilisateur
- **Token unique** : Gestion du token `'token'` pour les utilisateurs (pas d'admin sur mobile)
- **Routes protégées** : Composants ProtectedRoute avec redirection mobile
- **Contexte d'authentification** : État global de connexion persistant
- **Bouton retour Android** : Gestion native du bouton retour

### 👥 Gestion des Duellistes (Mobile)
- **Liste mobile** : Affichage optimisé pour écrans tactiles
- **Recherche** : Interface de recherche mobile
- **Upload d'avatars** : Sélection et upload depuis la galerie/caméra
- **Profils détaillés** : Visualisation des statistiques individuelles

### ⚔️ Système de Duels (Mobile)
- **Interface tactile** : Proposition et gestion de duels sur mobile
- **Validation de scores** : Saisie optimisée pour clavier mobile
- **États visuels** : Indicateurs colorés adaptés aux petits écrans
- **Historique mobile** : Navigation fluide dans l'historique des duels

### 🔔 Notifications Push
- **Capacitor Push** : Plugin @capacitor/push-notifications configuré
- **Configuration native** : Support Android avec badge, son et alertes
- **Navigation automatique** : Ouverture directe vers les sections concernées

### 🏠 Pages et Navigation
- **Home** : Page d'accueil avec présentation
- **Dashboard** : Tableau de bord utilisateur
- **Login/Register** : Authentification mobile
- **Duels** : Gestion des duels
- **Duellistes** : Annuaire des escrimeurs
- **Paramètres** : Configuration utilisateur

## 🚀 Démarrage rapide

### 📋 Prérequis
- Node.js >= 18.0.0
- npm >= 9.0.0
- Android Studio (pour le développement Android)
- JDK 11 ou supérieur

### 🛠️ Installation Développement

1. **Cloner et installer**
```bash
git clone https://github.com/BenribsLab/duelByBenribsLab.git
cd duelByBenribsLab/duel-mobile
npm install
```

2. **Configurer l'environnement**
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos paramètres
```

3. **Développement web**
```bash
# Mode développement navigateur
npm run dev
```

4. **Build et synchronisation mobile**
```bash
# Build de l'application
npm run build

# Synchroniser avec Capacitor
npx cap sync android

# Ouvrir dans Android Studio
npx cap open android
```

### 📱 Développement Android

1. **Premier build Android**
```bash
# S'assurer que le build web est fait
npm run build

# Synchroniser les assets web vers Android
npx cap sync android

# Ouvrir Android Studio
npx cap open android
```

2. **Développement avec Android Studio**
- Ouvrir le projet dans `/android`
- Connecter un appareil ou démarrer un émulateur
- Cliquer sur "Run" pour installer l'app

## 🔧 Configuration

### Variables d'Environnement
```bash
# Configuration API
VITE_API_BASE_URL=https://api-duel.benribs.fr/api

# Configuration de l'application mobile
VITE_APP_NAME="Duel Mobile"
VITE_APP_VERSION=1.0.0

# Environnement
VITE_NODE_ENV=development|production
```

### Configuration Capacitor
```json
// capacitor.config.json
{
  "appId": "com.benribslab.duel",
  "appName": "Duel App",
  "webDir": "dist",
  "plugins": {
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
  }
}
```

## 🏗️ Architecture Mobile

### 🔄 Intercepteur Axios Simplifié

L'application mobile utilise un intercepteur Axios optimisé pour les utilisateurs uniquement :

```javascript
// src/services/api.js - Intercepteur mobile
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gestion des erreurs 401 avec déconnexion
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirection mobile vers login
    }
    return Promise.reject(error);
  }
);
```

**Différences avec le frontend** :
- ✅ **Simplifié** : Token unique `'token'` (pas d'admin sur mobile)
- ✅ **Optimisé mobile** : Gestion d'erreur adaptée aux contraintes mobiles
- ✅ **Performance** : Intercepteur allégé pour appareils mobiles

### 📱 Gestion du Bouton Retour Android

```javascript
// hooks/useBackButton.js
const useBackButton = ({ fallbackRoute = '/', preventExit = true }) => {
  useEffect(() => {
    const handleBackButton = () => {
      const currentPath = window.location.pathname;
      
      if (currentPath === fallbackRoute && preventExit) {
        // Afficher confirmation de sortie
        return false;
      }
      
      // Navigation normale
      window.history.back();
      return true;
    };

    // Écouter l'événement de bouton retour Capacitor
    document.addEventListener('backbutton', handleBackButton);
    
    return () => {
      document.removeEventListener('backbutton', handleBackButton);
    };
  }, [fallbackRoute, preventExit]);
};
```

## 📁 Structure du Projet Mobile

```
src/
├── main.jsx                  # Point d'entrée React
├── App.jsx                   # Composant principal avec routeur mobile
├── config.js                 # Configuration API mobile
├── index.css                 # Styles globaux Tailwind
├── components/               # Composants mobiles
│   ├── MobileLayout.jsx      # Layout principal mobile
│   ├── SplashScreen.jsx      # Écran de démarrage
│   ├── ProtectedRoute.jsx    # Routes protégées
│   ├── Header.jsx            # En-tête mobile
│   ├── TopNavigation.jsx     # Navigation tactile
│   ├── Avatar.jsx            # Composant avatar
│   ├── ScoreModal.jsx        # Modal de saisie de score
│   └── NotificationDropdown.jsx # Notifications
├── pages/                    # Pages mobiles
│   ├── Home.jsx              # Page d'accueil
│   ├── Login.jsx             # Connexion
│   ├── Register.jsx          # Inscription
│   ├── Dashboard.jsx         # Tableau de bord
│   ├── Duels.jsx             # Gestion des duels
│   ├── Duellistes.jsx        # Liste des duellistes
│   └── Parametres.jsx        # Paramètres utilisateur
├── services/                 # Services API mobiles
│   ├── api.js                # Axios + intercepteur simplifié
│   ├── pushNotificationService.js # Gestion push
│   ├── authService.js        # Authentification
│   ├── duellistesService.js  # API duellistes
│   ├── duelsService.js       # API duels
│   └── uploadService.js      # Upload mobile
├── context/                  # Contextes React
│   ├── AuthContext.jsx       # Authentification mobile
│   └── NotificationContext.jsx # Notifications
├── hooks/                    # Hooks mobiles
│   └── useBackButton.js      # Gestion bouton retour Android
└── assets/                   # Assets mobiles
    └── images/
```

## 📦 Technologies et Stack Mobile

### 📱 Dépendances Principales

| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| **React** | ^19.1.1 | Framework UI |
| **Capacitor Core** | ^7.4.3 | Framework hybride |
| **Capacitor Android** | ^7.4.3 | Plateforme Android native |
| **Capacitor Push** | ^7.0.3 | Notifications push |
| **Vite** | ^7.1.2 | Build tool mobile |
| **React Router** | ^7.9.1 | Routage mobile |
| **Axios** | ^1.12.2 | Client HTTP avec intercepteur |
| **Tailwind CSS** | ^4.1.13 | Framework CSS mobile |
| **Lucide React** | ^0.544.0 | Icônes adaptées mobile |

### 🔌 Plugins Capacitor

| Plugin | Utilisation |
|--------|-------------|
| **@capacitor/app** | Événements d'application (pause, resume) |
| **@capacitor/preferences** | Stockage local sécurisé |
| **@capacitor/push-notifications** | Notifications push Firebase |

## 🔔 Notifications Push

### Configuration Firebase
```javascript
// services/pushNotificationService.js
class PushNotificationService {
  async requestPermissions() {
    // Demander permissions Android
    const result = await PushNotifications.requestPermissions();
    return result.receive === 'granted';
  }

  async registerForPush() {
    await PushNotifications.register();
    
    // Écouter le token FCM
    PushNotifications.addListener('registration', (token) => {
      this.savePushToken(token.value);
    });
    
    // Écouter les notifications reçues
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      this.handleNotification(notification);
    });
  }
}
```

### Configuration Android

Le fichier `android/app/google-services.json` doit être configuré avec vos credentials Firebase.

## 🚀 Build et Déploiement

### 📦 Build Local

```bash
# Build web
npm run build

# Synchroniser avec Android
npx cap sync android

# Build APK debug
npx cap run android

# Build APK release (dans Android Studio)
# Build > Generate Signed Bundle / APK
```

### 🏗️ Pipeline CI/CD

```yaml
# Exemple GitHub Actions (non configuré)
name: Build Mobile App
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npx cap sync android
      # Upload vers Play Store Console
```

## 🔐 Sécurité Mobile

### 🛡️ Mesures de Sécurité

**Authentification** :
- ✅ Token JWT stocké dans localStorage
- ✅ Auto-déconnexion sur erreur 401/403
- ✅ Intercepteur automatique pour toutes les requêtes
- ✅ Pas d'accès admin (sécurité par conception)

**Stockage** :
- ✅ Capacitor Preferences pour données sensibles
- ✅ localStorage pour cache temporaire
- ✅ Pas de stockage de mots de passe en local

**Communication** :
- ✅ HTTPS uniquement vers l'API
- ✅ Validation des certificats SSL
- ✅ Timeout sur les requêtes réseau

### 📱 Permissions Android

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
```

## 🧪 Tests et Qualité Mobile

### 📱 Tests sur Appareils

**Tests manuels** :
- ⚠️ Tests automatisés : Non configurés
- ✅ Tests manuels sur émulateur Android
- ⚠️ Tests sur appareils physiques : À faire
- ⚠️ Tests de performance mobile : Non mesurés

**Compatibilité** :
- ✅ Android API 24+ (Android 7.0+)
- ❌ iOS : Non supporté actuellement
- ✅ Émulateurs Android Studio

## 🛠️ Développement

### 🔄 Workflow de Développement

1. **Développement web**
```bash
npm run dev
# Test dans le navigateur avec outils dev
```

2. **Test mobile**
```bash
npm run build
npx cap sync android
npx cap run android
```

3. **Debug mobile**
- Chrome DevTools pour le webview
- Android Studio Logcat pour les logs natifs
- Capacitor Live Reload pour le développement

### 📋 Différences avec le Frontend

| Aspect | Frontend React | Mobile React |
|--------|----------------|--------------|
| **Admin** | Interface complète | ❌ Pas d'accès admin |
| **Tokens** | Dual (user + admin) | User uniquement |
| **Navigation** | React Router web | React Router + bouton retour |
| **Notifications** | Web (à venir) | ✅ Push natives |
| **Upload** | Drag & drop | Galerie/caméra native |
| **Déploiement** | Web hosting | ✅ APK Android |

### 🐛 Debug et Logs

```bash
# Logs en temps réel depuis l'appareil
npx cap run android --livereload

# Logs Android natifs
adb logcat

# Debug Chrome DevTools
# chrome://inspect dans Chrome
```

## 📚 Ressources et Documentation

### 🔗 Liens Utiles

- **App Android** : Installation via APK (en développement)
- **API Backend** : https://api-duel.benribs.fr
- **Frontend Web** : https://duel.benribs.fr
- **Repository GitHub** : https://github.com/BenribsLab/duelByBenribsLab

### 📖 Documentation Technique

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [React Documentation](https://react.dev)
- [Android Development](https://developer.android.com)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)

## 🚀 Roadmap Mobile

### ✅ Implémenté
- Interface mobile React
- Authentification automatique
- Gestion des duellistes et duels
- Notifications push Android
- Build APK

### 🔄 En Cours
- Tests sur appareils physiques
- Optimisation des performances
- Interface utilisateur mobile améliorée

### 📋 À Venir
- Support iOS avec Capacitor
- Mode offline basique
- Synchronisation en arrière-plan
- Publication sur Google Play Store

## 📝 Licence

MIT - **Benribs Lab** © 2025

---

**📱 Application mobile développée avec passion pour la communauté de l'escrime !**
