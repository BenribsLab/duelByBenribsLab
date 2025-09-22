# 🤺 Duel by Benribs Lab - Frontend React

Interface web complète pour l'application de gestion de duels d'escrime. Cette application React moderne offre une expérience utilisateur fluide avec un système d'authentification automatique, gestion des duellistes, organisation de duels, et interface d'administration complète.

## ✨ Fonctionnalités principales

### 🎯 Interface Utilisateur
- **Design moderne** : Interface React responsive avec Tailwind CSS
- **Navigation intuitive** : Menu dynamique adaptatif
- **Performance optimisée** : Bundle splitting et lazy loading avec Vite

### 🔐 Authentification Automatique
- **JWT Automatique** : Intercepteur Axios qui ajoute automatiquement les tokens
- **Gestion dual-token** : Support utilisateur (`token`) et admin (`admin_auth_token`)
- **Reconnexion automatique** : Refresh tokens transparents
- **Routes protégées** : Composants ProtectedRoute avec redirection
- **Contexte d'authentification** : État global de connexion

### 👥 Gestion des Duellistes
- **CRUD complet** : Création, modification, suppression des profils
- **Upload d'avatars** : Glisser-déposer avec prévisualisation
- **Recherche avancée** : Filtres par catégorie, statut, pseudo
- **Pagination intelligente** : Navigation fluide dans les listes
- **Validation temps réel** : Contrôles instantanés des formulaires

### ⚔️ Système de Duels
- **Workflow visuel** : États des duels avec indicateurs colorés
- **Proposition intuitive** : Formulaire guidé de création de duel
- **Validation collaborative** : Interface de saisie/validation des scores
- **Historique détaillé** : Timeline complète des actions
- **Notifications en temps réel** : Alertes pour les actions importantes

### 🏆 Classements et Statistiques
- **Tableaux dynamiques** : Classements interactifs avec tri
- **Graphiques** : Visualisations des performances
- **Filtres avancés** : Par catégorie, période, statistiques
- **Export de données** : Téléchargement des classements

### 👑 Interface d'Administration
- **Dashboard complet** : Vue d'ensemble des activités
- **Gestion des utilisateurs** : Supervision et modération
- **Gestion des duels** : Interface de supervision des duels
- **Migration de base** : Interface web pour SQLite → MySQL
- **Système d'invitations** : Envoi, suivi, suppression et tracking des invitations par email

## 🚀 Démarrage rapide

### 🐳 Installation avec Docker (Recommandée)

#### Prérequis
- Docker >= 20.0.0
- Docker Compose >= 2.0.0

#### Démarrage rapide
1. **Cloner le projet**
```bash
git clone https://github.com/BenribsLab/duelByBenribsLab.git
cd duelByBenribsLab
```

2. **Lancer avec Docker Compose**
```bash
# Mode production
docker-compose up -d --build
```

L'application sera accessible sur : http://localhost:5173

### 🛠️ Installation manuelle (Alternative)

#### Prérequis
- Node.js >= 18.0.0
- npm >= 9.0.0

#### Installation
1. **Aller dans le dossier frontend**
```bash
cd duel-frontend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos paramètres
```

4. **Démarrer l'application**
```bash
# Mode développement
npm run dev

# Build de production
npm run build

# Aperçu de la production
npm run preview
```

> **💡 Note :** L'installation Docker est recommandée car elle configure automatiquement l'environnement complet.

## 🔧 Configuration

### Variables d'Environnement

```bash
# Configuration API
VITE_API_BASE_URL=https://api-duel.benribs.fr/api

# Configuration de l'application
VITE_APP_NAME="Duel by Benribs Lab"
VITE_APP_VERSION=1.0.0

# Environnement
VITE_NODE_ENV=development|production

# URLs de redirection
VITE_REDIRECT_URL=https://duel.benribs.fr

# Configuration PWA
VITE_PWA_NAME="Duel App"
VITE_PWA_SHORT_NAME="Duel"
```

### Structure de Configuration

```javascript
// src/config.js
const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3003/api',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Duel App',
  VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  IS_PRODUCTION: import.meta.env.VITE_NODE_ENV === 'production'
};
```

## 🏗️ Architecture

### 🔄 Intercepteur Axios Automatique

L'application utilise un système d'intercepteur sophistiqué pour gérer automatiquement l'authentification :

```javascript
// src/services/api.js - Intercepteur intelligent
api.interceptors.request.use((config) => {
  const isPublicRoute = publicRoutes.some(route => 
    config.url && config.url.includes(route)
  );
  
  if (!isPublicRoute) {
    let token;
    
    // Détection automatique admin vs user
    if (config.url && config.url.includes('/admin/')) {
      token = localStorage.getItem('admin_auth_token');
    } else {
      token = localStorage.getItem('token');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return config;
});
```

**Avantages** :
- ✅ **Automatique** : Plus besoin d'ajouter manuellement les headers
- ✅ **Intelligent** : Détecte automatiquement le type de route (user/admin)
- ✅ **Sécurisé** : Gestion des erreurs 401/403 avec déconnexion auto
- ✅ **Transparent** : Fonctionne avec tous les services existants

### 🛡️ Routes Protégées

```javascript
// Composant ProtectedRoute
function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAuthenticated, isAdmin } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}
```

### 📱 Contexte d'Authentification

```javascript
// src/context/AuthContext.jsx
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Auto-vérification au démarrage
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  const login = async (credentials) => {
    // Gestion connexion avec stockage token
  };
  
  const logout = () => {
    // Nettoyage tokens et redirection
  };
  
  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isAdmin, loading,
      login, logout, checkAuthStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## 📁 Structure du Projet

```
src/
├── main.jsx                  # Point d'entrée React
├── App.jsx                   # Composant principal avec routeur
├── config.js                 # Configuration centralisée
├── index.css                 # Styles globaux Tailwind
├── components/               # Composants réutilisables
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── ProtectedRoute.jsx
│   ├── duellistes/
│   │   ├── DuelisteCard.jsx
│   │   ├── DuelisteForm.jsx
│   │   ├── DuelisteList.jsx
│   │   └── AvatarUpload.jsx
│   ├── duels/
│   │   ├── DuelCard.jsx
│   │   ├── DuelForm.jsx
│   │   ├── DuelList.jsx
│   │   ├── ScoreValidation.jsx
│   │   └── DuelWorkflow.jsx
│   ├── admin/
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminDuelsList.jsx
│   │   ├── AdminUsersList.jsx
│   │   ├── DatabaseMigration.jsx
│   │   └── InvitationsManager.jsx
│   ├── ui/                   # Composants UI de base
│   │   ├── Button.jsx
│   │   ├── Modal.jsx
│   │   ├── Table.jsx
│   │   ├── Pagination.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ErrorBoundary.jsx
│   └── layout/
│       ├── Navbar.jsx
│       ├── Sidebar.jsx
│       └── Footer.jsx
├── pages/                    # Pages principales
│   ├── HomePage.jsx
│   ├── LoginPage.jsx
│   ├── DuellistesPage.jsx
│   ├── DuelsPage.jsx
│   ├── ClassementPage.jsx
│   ├── ProfilePage.jsx
│   └── admin/
│       ├── AdminDashboard.jsx
│       ├── AdminDuelsPage.jsx
│       ├── AdminUsersPage.jsx
│       └── AdminSystemPage.jsx
├── services/                 # Services API
│   ├── api.js               # Instance Axios + intercepteurs
│   ├── authService.js       # Authentification
│   ├── duellistesService.js # Gestion duellistes
│   ├── duelsService.js      # Gestion duels
│   ├── classementService.js # Classements
│   ├── adminService.js      # Administration
│   ├── databaseService.js   # Migration DB
│   └── uploadService.js     # Upload fichiers
├── context/                  # Contextes React
│   ├── AuthContext.jsx      # État d'authentification
│   ├── ThemeContext.jsx     # Thème sombre/clair
│   └── NotificationContext.jsx # Notifications
├── hooks/                    # Hooks personnalisés
│   ├── useAuth.js           # Authentification
│   ├── useApi.js            # Requêtes API
│   ├── usePagination.js     # Pagination
│   └── useLocalStorage.js   # Stockage local
├── utils/                    # Utilitaires
│   ├── constants.js         # Constantes de l'app
│   ├── helpers.js           # Fonctions utiles
│   ├── validators.js        # Validation formulaires
│   └── formatters.js        # Formatage données
└── assets/                   # Assets statiques
    ├── images/
    ├── icons/
    └── fonts/
```

## 🎨 Technologies et Stack

### 📦 Dépendances Principales

| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| **React** | ^18.2.0 | Framework UI |
| **Vite** | ^5.0.0 | Build tool et dev server |
| **React Router** | ^6.8.0 | Routage côté client |
| **Axios** | ^1.6.0 | Client HTTP avec intercepteurs |
| **Tailwind CSS** | ^3.3.0 | Framework CSS utilitaire |
| **Lucide React** | ^0.263.0 | Icônes modernes |
| **React Hook Form** | ^7.45.0 | Gestion formulaires |
| **Date-fns** | ^2.30.0 | Manipulation dates |

### 🛠️ Outils de Développement

| Outil | Utilisation |
|-------|------------|
| **ESLint** | Linting JavaScript/React |
| **Prettier** | Formatage automatique |
| **Tailwind Config** | Configuration design system |
| **Vite Plugins** | PWA, React, optimisations |

## 🔐 Sécurité Frontend

### 🛡️ Mesures de Sécurité

**Authentification** :
- ✅ Tokens JWT sécurisés dans localStorage
- ✅ Auto-déconnexion sur token expiré (401/403)
- ✅ Vérification de statut au démarrage
- ✅ Routes protégées avec redirection

**Validation** :
- ✅ Validation côté client avec React Hook Form
- ✅ Sanitisation des entrées utilisateur
- ✅ Protection XSS sur l'affichage de contenu

**Communication API** :
- ✅ HTTPS uniquement en production
- ✅ Headers d'authentification automatiques
- ✅ Gestion des erreurs réseau/API
- ✅ Timeout configurable sur les requêtes

### 🔑 Gestion des Tokens

```javascript
// Stockage sécurisé des tokens
const authService = {
  // Token utilisateur standard
  setUserToken: (token) => {
    localStorage.setItem('token', token);
  },
  
  // Token administrateur
  setAdminToken: (token) => {
    localStorage.setItem('admin_auth_token', token);
  },
  
  // Nettoyage sécurisé
  clearTokens: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin_auth_token');
  },
  
  // Vérification validité
  isTokenValid: (token) => {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }
};
```

## 🚀 Fonctionnalités Détaillées

### 👥 Module Duellistes

**Fonctionnalités** :
- Liste paginée avec recherche en temps réel
- Formulaire de création/modification avec validation
- Upload d'avatar par glisser-déposer
- Filtres par catégorie (JUNIOR/SENIOR) et statut
- Suppression avec confirmation
- Affichage des statistiques individuelles

**Composants clés** :
```javascript
// Composant principal avec hooks
function DuellistesPage() {
  const [duellistes, setDuellistes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const { currentPage, goToPage } = usePagination();
  
  useEffect(() => {
    loadDuellistes();
  }, [filters, currentPage]);
  
  return (
    <div className="space-y-6">
      <DuelisteFilters onFiltersChange={setFilters} />
      <DuelisteList 
        duellistes={duellistes}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <Pagination 
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
      />
    </div>
  );
}
```

### ⚔️ Module Duels

**Workflow complet** :
1. **PROPOSE** : Formulaire de proposition avec sélection d'adversaire
2. **ACCEPTE/REFUSE** : Interface de réponse avec raison optionnelle
3. **A_JOUER** : Planification et préparation du duel
4. **EN_ATTENTE_VALIDATION** : Saisie des scores par les participants
5. **VALIDE** : Duel terminé avec statistiques mises à jour

**Composants de validation** :
```javascript
function ScoreValidation({ duel, onValidate }) {
  const [scores, setScores] = useState({
    scoreProvocateur: '',
    scoreAdversaire: '',
    touchesProvocateur: '',
    touchesAdversaire: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await duelsService.validateScore(duel.id, scores);
      onValidate();
      toast.success('Score validé avec succès !');
    } catch (error) {
      toast.error('Erreur lors de la validation');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Formulaire de saisie des scores */}
    </form>
  );
}
```

### 🏆 Module Classements

**Fonctionnalités** :
- Classement général et par catégorie
- Graphiques de progression individuelle
- Statistiques détaillées (victoires, défaites, ratio)
- Export des données au format CSV
- Comparaison entre duellistes

### 👑 Interface d'Administration

**Dashboard admin** :
- Vue d'ensemble des activités récentes
- Graphiques de statistiques globales
- Alertes et notifications système
- Raccourcis vers les fonctions principales

**Gestion des duels** :
- Liste complète avec filtres avancés
- Possibilité de forcer la validation
- Suppression avec justification
- Historique des actions admin

**Migration de base** :
- Interface web intuitive pour SQLite → MySQL
- Tests de connexion en temps réel
- Prévisualisation des données à migrer
- Workflow guidé étape par étape

## 🎯 Performance et Optimisation

### ⚡ Optimisations Vite

```javascript
// vite.config.js - Optimisations
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react'],
          utils: ['date-fns', 'axios']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
});
```

### 🚀 Stratégies de Performance

**Code Splitting** :
```javascript
// Lazy loading des pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const DuellistesPage = lazy(() => import('./pages/DuellistesPage'));

// Route avec Suspense
<Route 
  path="/admin" 
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <AdminDashboard />
    </Suspense>
  } 
/>
```

**Optimisation des images** :
- Upload d'avatars avec validation de taille et format
- Support des formats PNG, JPG, JPEG, WebP
- Limitation de taille (5MB max)
- Stockage serveur avec URLs dynamiques

**Mise en cache intelligente** :
- localStorage pour l'authentification et préférences
- Cache navigateur par défaut
- Service Worker : Non implémenté

## 🧪 Tests et Qualité

### 🔍 Stratégie de Tests

```bash
# Tests unitaires (à venir)
npm run test

# Tests d'intégration
npm run test:integration

# Tests e2e avec Cypress
npm run test:e2e

# Coverage
npm run test:coverage
```

### 📊 Métriques de Qualité

**Performance** :
- ⚠️ Bundle size : À optimiser (en cours d'analyse)
- ⚠️ Performance web : Non mesurée actuellement
- ✅ Interface responsive et fluide
- ✅ Chargement rapide grâce à Vite

**Accessibilité** :
- ⚠️ Accessibilité : À améliorer (non testée)
- ✅ Interface utilisable au clavier
- ⚠️ ARIA labels : À compléter
- ⚠️ Contraste couleurs : Non vérifié

**SEO** :
- ⚠️ Meta tags : Basiques uniquement
- ⚠️ Structure sémantique : Partiellement implémentée
- ⚠️ URLs : Routes React (non SEO-friendly)
- ❌ Sitemap.xml : Non généré

## 🚀 Déploiement

### 🐳 Docker (Recommandé)

```dockerfile
# Dockerfile optimisé multi-stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 🌐 Déploiement Web

**Netlify/Vercel** :
```bash
# Build command
npm run build

# Output directory
dist

# Environment variables
VITE_API_BASE_URL=https://api-duel.benribs.fr/api
VITE_NODE_ENV=production
```

**Apache/Nginx** :
```nginx
# Configuration suggérée pour SPA (non testée)
server {
    listen 80;
    server_name duel.benribs.fr;
    root /var/www/html;
    index index.html;
    
    # SPA fallback pour React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache des assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 📈 Monitoring Production

**Métriques à surveiller** (non implémentées actuellement) :
- Temps de chargement des pages
- Taux d'erreur JavaScript
- Utilisation de l'API
- Conversions utilisateur

**Outils recommandés** (non configurés) :
- Google Analytics 4
- Sentry pour le monitoring d'erreurs
- Lighthouse CI pour la performance
- Uptime monitoring

## 🤝 Développement et Contribution

### 🛠️ Workflow de Développement

1. **Setup environnement**
```bash
git clone https://github.com/BenribsLab/duelByBenribsLab.git
cd duelByBenribsLab/duel-frontend
npm install
npm run dev
```

2. **Conventions de code**
- ESLint + Prettier configurés
- Commits conventionnels (feat, fix, docs, etc.)
- Composants en PascalCase
- Hooks en camelCase avec prefix "use"

3. **Structure des commits**
```
feat(duellistes): add avatar upload functionality
fix(auth): resolve token refresh issue
docs(readme): update installation instructions
```

### 📋 Checklist de Contribution

- [ ] Code respecte les conventions ESLint/Prettier
- [ ] Composants documentés avec JSDoc
- [ ] Tests ajoutés pour nouvelles fonctionnalités
- [ ] README mis à jour si nécessaire
- [ ] Variables d'environnement documentées

## 📚 Ressources et Documentation

### 🔗 Liens Utiles

- **Démo en ligne** : https://duel.benribs.fr
- **API Backend** : https://api-duel.benribs.fr
- **Documentation API** : [README API](../duel-api/README.md)
- **Repository GitHub** : https://github.com/BenribsLab/duelByBenribsLab

### 📖 Documentation Technique

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com)
- [Axios Documentation](https://axios-http.com/docs/intro)

## 📝 Licence

MIT - **Benribs Lab** © 2025

---

**🤺 Interface moderne développée avec passion pour la communauté de l'escrime !**
