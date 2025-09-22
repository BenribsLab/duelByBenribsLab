# 🤺 Duel by Benribs Lab

**Écosystème complet de gestion de duels d'escrime** - Application web/mobile + API + Plugin WordPress pour gérer les défis, classements et communauté d'escrimeurs.

## 🎯 Vision du Projet

**Duel by Benribs Lab** démocratise l'organisation de duels d'escrime en offrant une plateforme moderne où tout escrimeur peut défier n'importe qui, valider ses résultats de façon transparente, et suivre sa progression dans un classement équitable basé sur les victoires.

### ⚔️ Philosophie
- **Défi universel** : Tout le monde peut défier tout le monde, sans restriction
- **Validation collaborative** : Les joueurs valident leurs propres résultats
- **Transparence totale** : Classements et statistiques visibles par tous
- **Égalité des chances** : Même algorithme de classement pour tous

## 🏗️ Écosystème Technique

### 📱 Applications et Interfaces

| Composant | Technologie | Utilisation | Documentation |
|-----------|-------------|-------------|---------------|
| **🌐 Application Web** | React 19 + Vite | Interface principale desktop/mobile | [📖 Frontend README](./duel-frontend/README.md) |
| **📱 App Mobile** | React + Capacitor | Application native Android | [📖 Mobile README](./duel-mobile/README.md) |
| **🗂️ Plugin WordPress** | PHP + Shortcodes | Intégration sur sites web | [📖 WordPress README](./WP_DuelByBenribsLab/README.md) |

### ⚙️ Backend et Infrastructure

| Service | Technologie | Rôle | Documentation |
|---------|-------------|------|---------------|
| **🔧 API REST** | Node.js + Express + Prisma | Backend central avec authentification JWT | [📖 API README](./duel-api/README.md) |
| **🐳 Conteneurisation** | Docker + Docker Compose | Déploiement production | - |
| **💾 Base de Données** | SQLite ↔ MySQL | Stockage avec switch dynamique | Voir API README |

## 🚀 Démarrage Rapide

### ⚡ Installation Express (Docker)

```bash
# Cloner le projet
git clone https://github.com/BenribsLab/DuelByBenribsLab.git
cd DuelByBenribsLab

# Démarrage production complet (API + Frontend + MySQL)
docker-compose up -d --build
```

**Accès immédiat :**
- 🌐 **Application** : http://localhost:5173
- 🔧 **API** : http://localhost:3003/api
- 📊 **Admin** : http://localhost:5173/admin

### 🛠️ Installation Développement

```bash
# Backend (Terminal 1)
cd duel-api
npm install
npm run dev    # Port 3000

# Frontend (Terminal 2)  
cd duel-frontend
npm install
npm run dev    # Port 5173

# Mobile (Terminal 3)
cd duel-mobile
npm install
npm run dev    # Développement web
# ou: npx cap run android (pour Android)

# WordPress (Installation manuelle)
cp -r WP_DuelByBenribsLab /wp-content/plugins/
# Activer dans l'admin WordPress
```

## 🎮 Fonctionnalités Principales

### ⚔️ Système de Duels
- **Défis ouverts** : Tout duelliste peut en défier un autre
- **États dynamiques** : `proposé` → `accepté` → `validé`
- **Validation flexible** : Par arbitre ou double saisie joueurs
- **Calendrier** : Programmation optionnelle des rencontres

### 👥 Gestion des Duellistes
- **Profils complets** : Pseudo, avatar, statistiques personnelles
- **Authentification moderne** : JWT + OTP email ou mot de passe classique
- **Données en temps réel** : Synchronisation automatique entre interfaces

### 🏆 Classement Équitable
1. **Victoires** (critère principal absolu)
2. **Taux de victoire** (départage des égalités)
3. **Indice touches** (touches données - reçues, plafonné ±5/duel)

### � Tableaux de Bord
- **Classement général** en temps réel
- **Classement junior** (catégorie spécialisée)
- **Statistiques individuelles** : V/D, ratio, évolution
- **Historique complet** des affrontements

## � Sécurité et Authentification

### 🛡️ Architecture de Sécurité
- **Tokens JWT** avec expiration automatique
- **Double authentification** : Token utilisateur + token admin
- **Routes protégées** avec middleware automatique
- **Sessions sécurisées** adaptées à chaque plateforme :
  - **Web/Mobile** : localStorage avec intercepteurs Axios
  - **WordPress** : Sessions PHP natives

### 🔑 Modes d'Authentification
- **Mode Email/OTP** : Codes à usage unique par email
- **Mode Classique** : Pseudo + mot de passe
- **Auto-détection** : Interface s'adapte selon l'identifiant saisi

## 📱 Multi-Plateforme

### 🌐 Expérience Uniforme
Toutes les interfaces partagent la même API et offrent des fonctionnalités cohérentes :

| Fonctionnalité | Web React | Mobile Capacitor | WordPress Plugin |
|----------------|-----------|------------------|------------------|
| **Authentification** | ✅ Complète | ✅ Utilisateur uniquement | ✅ Complète |
| **Gestion Duels** | ✅ Interface complète | ✅ Optimisée tactile | ✅ Shortcodes flexibles |
| **Administration** | ✅ Panel complet | ❌ Sécurité mobile | ❌ Read-only |
| **Notifications** | 🔄 En développement | ✅ Push natives | ✅ Intégration WP |
| **Classements** | ✅ Tableaux avancés | ✅ Vue mobile | ✅ Widgets configurables |

### 📚 Documentation Spécialisée

Chaque composant dispose de sa documentation détaillée :

#### 🔧 **[API Backend](./duel-api/README.md)**
- Endpoints complets avec exemples
- Système d'authentification JWT
- Architecture Prisma + Base de données
- Configuration et déploiement

#### 🌐 **[Frontend React](./duel-frontend/README.md)**
- Architecture React 19 + Vite
- Intercepteur Axios automatique
- Composants et pages détaillés
- Build et optimisation

#### 📱 **[Mobile Capacitor](./duel-mobile/README.md)**
- Configuration Android/iOS
- Plugins natifs (notifications, caméra)
- Build APK et déploiement
- Différences avec le frontend

#### 🗂️ **[Plugin WordPress](./WP_DuelByBenribsLab/README.md)**
- 6 shortcodes configurables
- Intégration sécurisée WordPress
- Personnalisation CSS
- Exemples d'utilisation

#### 🐳 **Configuration Docker**
- Setup production avec MySQL
- Conteneurisation API + Frontend
- Variables d'environnement
- Volumes et persistance de données

## 🎯 Modes de Déploiement

### 🚀 Production Docker (Recommandé)
```bash
# Démarrage complet avec MySQL
docker-compose up -d --build

# Accès aux services :
# http://localhost:5173        - Application web
# http://localhost:5173/admin  - Panel admin
# http://localhost:3003/api    - API REST
```

### 🛠️ Développement Local
```bash
# Backend (Terminal 1)
cd duel-api
npm install
npm run dev    # Port 3000

# Frontend (Terminal 2)  
cd duel-frontend
npm install
npm run dev    # Port 5173
```

### 📱 Build Mobile Android
```bash
# Application mobile native Android uniquement
cd duel-mobile
npm run build
npx cap sync android
npx cap open android
# Build APK depuis Android Studio
```

## � Synchronisation et Données

### � Cohérence Multi-Interface
- **API Centrale** : Source unique de vérité
- **Temps Réel** : Toutes les interfaces se synchronisent automatiquement
- **Cache Intelligent** : Optimisation des performances selon la plateforme
- **Validation Unique** : Règles métier centralisées dans l'API

### 💾 Persistance des Données
- **Profils utilisateurs** : Avatar, statistiques, préférences
- **Historique complet** : Tous les duels avec métadonnées
- **Classements calculés** : Mise à jour automatique à chaque validation
- **Sessions** : Gestion sécurisée multi-plateforme

## 🚧 Roadmap

### ✅ Phase 1 - MVP Complet (Actuel)
- [x] API REST complète avec authentification
- [x] Interface web React responsive  
- [x] Application mobile Android
- [x] Plugin WordPress fonctionnel
- [x] Système de duels et classements
- [x] Déploiement Docker

### 🔄 Phase 2 - Optimisation (En cours)
- [ ] Notifications push mobiles
- [ ] Mode offline basique
- [ ] Interface d'administration avancée
- [ ] Tests automatisés complets
- [ ] Support iOS

### 📋 Phase 3 - Extensions (Planifié)
- [ ] Tournois organisés
- [ ] API publique pour développeurs tiers
- [ ] Analyses et statistiques avancées
- [ ] Intégration réseaux sociaux
- [ ] Support multilingue

## 🛠️ Architecture Détaillée

### 🔄 Flow de Données
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Mobile    │    │ WordPress   │
│    React    │    │  Capacitor  │    │   Plugin    │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                   ┌──────▼──────┐
                   │  API REST   │
                   │ Node.js +   │
                   │ JWT Auth    │
                   └──────┬──────┘
                          │
                   ┌──────▼──────┐
                   │  Database   │
                   │SQLite/MySQL │
                   └─────────────┘
```

### 🔐 Sécurité Multi-Couches
```
Application Layer    │ Validation des entrées, sanitisation
─────────────────────┼──────────────────────────────────────
API Layer           │ JWT tokens, middleware d'auth
─────────────────────┼──────────────────────────────────────  
Database Layer      │ Requêtes préparées, isolation
─────────────────────┼──────────────────────────────────────
Infrastructure      │ Docker isolation, HTTPS
```

## 📊 Métriques et Performance

### 🎯 Objectifs de Performance
- **API Response Time** : < 200ms moyenne
- **Frontend Load** : < 2s première visite
- **Mobile App Size** : < 10MB APK
- **Database** : Support 1000+ utilisateurs simultanés

### 📈 Monitoring (Planifié)
- Temps de réponse API par endpoint
- Métriques d'usage par interface
- Performance des requêtes base de données
- Statistiques d'engagement utilisateur

## 🤝 Contribution

### � Setup Développeur
```bash
# Prérequis
node -v    # >= 18.0.0
npm -v     # >= 9.0.0
docker -v  # >= 20.0.0

# Installation complète
git clone https://github.com/BenribsLab/DuelByBenribsLab.git
cd DuelByBenribsLab

# Production Docker
docker-compose up -d --build

# Ou développement local
cd duel-api && npm install && npm run dev  # Terminal 1
cd duel-frontend && npm install && npm run dev  # Terminal 2
```

### 📋 Guidelines
- **Code Quality** : ESLint + Prettier sur tout le JavaScript
- **Documentation** : README à jour pour chaque modification
- **Tests** : Validation manuelle obligatoire avant commit
- **Security** : Pas de secrets dans le code, variables d'environnement

## 📝 Licence

**MIT License** - Benribs Lab © 2025

Projet open-source développé avec passion pour la communauté de l'escrime française.

---

## 🔗 Liens Rapides

- 🌐 **Demo Live** : https://duel.benribs.fr
- 📱 **APK Android** : [Releases GitHub](https://github.com/BenribsLab/DuelByBenribsLab/releases)
- 📚 **Documentation API** : [API README](./duel-api/README.md)
-  **Issues** : [GitHub Issues](https://github.com/BenribsLab/DuelByBenribsLab/issues)

**🤺 Développé avec passion pour faire vivre l'escrime à l'ère numérique !**