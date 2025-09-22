# 🤺 Duel by Benribs Lab - API Backend

API REST complète pour l'application de gestion de duels d'escrime. Cette API gère l'ensemble des fonctionnalités métier incluant la gestion des duellistes, l'organisation de duels, le système de validation des scores, l'administration, et la migration automatique de bases de données.

## ✨ Fonctionnalités principales

### 🥇 Gestion des Duellistes
- **CRUD complet** : création, lecture, modification, suppression
- **Système d'avatars** : upload et gestion des photos de profil
- **Catégories** : JUNIOR / SENIOR
- **Statistiques automatiques** : victoires, défaites, indice touches
- **Validation robuste** : pseudo unique, formats contrôlés

### ⚔️ Système de Duels
- **Proposition de duels** : duel entre deux escrimeurs avec arbitre optionnel
- **Workflow complet** : PROPOSE → ACCEPTE/REFUSE → A_JOUER → EN_ATTENTE_VALIDATION → VALIDE
- **Double validation des scores** : chaque joueur ou l'arbitre peuvent saisir
- **Gestion des conflits** : résolution des désaccords de scores
- **Historique complet** : traçabilité de toutes les actions

### 🏆 Classement et Statistiques
- **Classement dynamique** : calcul automatique basé sur les performances
- **Statistiques individuelles** : ratios, évolution, historique
- **Filtres avancés** : par catégorie, période, etc.

### 👑 Administration
- **Interface d'administration** sécurisée
- **Gestion des duels** : supervision, validation forcée
- **Système d'invitations** : invitation de nouveaux utilisateurs
- **Migration de base de données** : SQLite ↔ MySQL automatique
- **Monitoring** : logs, statistiques d'usage

### 🗄️ Migration de Base de Données
- **Migration automatique** SQLite vers MySQL
- **3 modes de migration** :
  - **Fusion** : ajoute les données à l'existant
  - **Écrasement** : remplace complètement les données
  - **Skip** : migration sans données
- **Interface web intuitive** : workflow guidé étape par étape
- **Sécurité** : vérifications et rollback en cas d'erreur

### 🔐 Authentification et Sécurité
- **Authentification JWT** pour utilisateurs et admins
- **Middleware de sécurité** : Helmet, CORS, Rate limiting
- **Validation stricte** : Joi + express-validator
- **Accès restreint** : routes admin protégées

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

2. **Configurer l'environnement**
```bash
# Copier le fichier d'exemple dans duel-api/
cp duel-api/.env.example duel-api/.env

# Éditer duel-api/.env avec vos paramètres
```

3. **Lancer avec Docker Compose**
```bash
# Mode développement
docker-compose -f docker-compose.dev.yml up -d

# Mode production
docker-compose up -d --build
```

L'API sera accessible sur : http://localhost:3003

### 🛠️ Installation manuelle (Alternative)

#### Prérequis
- Node.js >= 16.0.0
- npm >= 8.0.0

#### Installation
1. **Aller dans le dossier API**
```bash
cd duel-api
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

4. **Initialiser la base de données**
```bash
# Générer le client Prisma
npm run db:generate

# Créer/mettre à jour la base de données
npm run db:push

# Alimenter avec des données de test
npm run db:seed
```

5. **Démarrer le serveur**
```bash
# Mode développement (avec rechargement automatique)
npm run dev

# Mode production
npm start
```

> **💡 Note :** L'installation Docker est recommandée car elle inclut automatiquement SQLite et toutes les dépendances système nécessaires.

## 📡 Documentation des Routes

### 🏠 Routes de Base
- `GET /` - Page d'accueil de l'API
- `GET /api/health` - Status de santé (health check)

### 👥 Duellistes (`/api/duellistes`) ⚠️ **ROUTES PUBLIQUES**
> **🚨 ATTENTION CRITIQUE :** Ces routes sont actuellement **PUBLIQUES** (aucune authentification). N'importe qui peut créer, modifier ou supprimer des duellistes !

- `GET /` - Liste tous les duellistes **[PUBLIC]**
  - **Query params** : `page`, `limit`, `search`, `categorie`
- `GET /:id` - Détails d'un dueliste **[PUBLIC]**
- `POST /` - Créer un nouveau dueliste **[PUBLIC - DANGEREUX ⚠️]**
  - **Body** : `pseudo`, `avatarUrl?`, `categorie?`
- `PUT /:id` - Modifier un dueliste **[PUBLIC - DANGEREUX ⚠️]**
- `DELETE /:id` - Supprimer un dueliste **[PUBLIC - DANGEREUX ⚠️]**

### ⚔️ Duels (`/api/duels`) ⚠️ **ROUTES PUBLIQUES**
> **🚨 ATTENTION CRITIQUE :** Ces routes sont actuellement **PUBLIQUES** (aucune authentification). N'importe qui peut proposer des duels, accepter, ou saisir des scores !

- `GET /` - Liste tous les duels **[PUBLIC]**
  - **Query params** : `page`, `limit`, `etat`, `duelisteId`
- `GET /:id` - Détails d'un duel **[PUBLIC]**
- `POST /` - Proposer un nouveau duel **[PUBLIC - DANGEREUX ⚠️]**
  - **Body** : `provocateurId`, `adversaireId`, `arbitreId?`, `dateProgrammee?`, `notes?`
- `PUT /:id/accepter` - Accepter un duel proposé **[PUBLIC - DANGEREUX ⚠️]**
- `PUT /:id/refuser` - Refuser un duel proposé **[PUBLIC - À SÉCURISER]**
  - **Body** : `raison?`
- `POST /:id/score` - Saisir un score **[PUBLIC - À SÉCURISER]**
  - **Body** : `scoreProvocateur`, `scoreAdversaire`, `touchesProvocateur`, `touchesAdversaire`
- `GET /:id/proposition-score` - Voir les propositions de score en attente **[PUBLIC]**
- `PUT /:id/accepter-score` - Accepter une proposition de score **[PUBLIC - À SÉCURISER]**

### 🏆 Classement (`/api/classement`)
- `GET /` - Classement général
  - **Query params** : `categorie`, `limit`
- `GET /:id` - Statistiques détaillées d'un dueliste

### 📤 Upload (`/api/upload`)
- `POST /avatar` - Upload d'avatar
  - **File** : image (PNG, JPG, JPEG, WebP)
  - **Size limit** : 5MB

### 🔐 Authentification (`/api/auth`)
- `POST /register` - Inscription
- `POST /login` - Connexion
- `POST /refresh` - Renouveler le token
- `POST /logout` - Déconnexion

### 📨 Invitations (`/api/invitations`)
- `POST /` - Envoyer une invitation
- `POST /accept/:token` - Accepter une invitation
- `GET /verify/:token` - Vérifier une invitation

### 📊 Tracking (`/api/track`)
- `POST /event` - Enregistrer un événement de tracking

### 👑 Administration (`/api/admin`)

#### Authentification Admin (`/api/admin/auth`)
- `POST /login` - Connexion admin
- `POST /refresh` - Renouveler token admin

#### Gestion Admin (`/api/admin`)
- `GET /stats` - Statistiques générales
- `GET /logs` - Logs système

#### Duels Admin (`/api/admin/duels`)
- `GET /` - Liste complète des duels
- `PUT /:id/forcer-validation` - Forcer la validation d'un duel
- `PUT /:id/annuler` - Annuler un duel

#### Base de Données (`/api/admin/database`)
- `GET /config` - Configuration actuelle de la DB
- `POST /test-connection` - Tester une connexion DB
- `POST /check-tables` - Vérifier les tables existantes
- `POST /create-tables` - Créer les tables manquantes
- `POST /check-content` - Vérifier le contenu des tables
- `POST /migrate` - Migrer les données (3 modes)
- `POST /finalize` - Finaliser la migration

#### Invitations Admin (`/api/admin/invitations`)
- `GET /` - Liste des invitations
- `POST /` - Créer une invitation
- `DELETE /:id` - Supprimer une invitation

## 🗄️ Base de Données

### Configuration Dynamique
L'API supporte une **configuration dynamique** de base de données :
- **SQLite** : Base par défaut, idéale pour le développement
- **MySQL** : Base de production, migration automatique disponible

### Variables d'Environnement
```bash
# Configuration générale
DB_PROVIDER=sqlite|mysql
DATABASE_URL=url_de_connexion

# MySQL spécifique (pour migration automatique)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=duel
DB_USER=username
DB_PASS=password

# SQLite spécifique
SQLITE_URL="file:./prisma/dev.db"
```

### Modèles de Données

#### 👤 Dueliste
```javascript
{
  id: Number,              // Identifiant unique auto-incrémenté
  pseudo: String,          // Nom d'affichage (unique)
  avatarUrl: String?,      // URL de l'avatar
  dateInscription: Date,   // Date d'inscription automatique
  statut: String,          // ACTIF, INACTIF, SUSPENDU
  email: String?,          // Email (unique, optionnel)
  passwordHash: String?,   // Hash du mot de passe
  authMode: String,        // PASSWORD, OAUTH, etc.
  emailVerified: Boolean,  // Email vérifié
  otpCode: String?,        // Code OTP temporaire
  otpExpiry: Date?,        // Expiration du code OTP
  nbVictoires: Number,     // Nombre de victoires
  nbDefaites: Number,      // Nombre de défaites
  nbMatchsTotal: Number,   // Total des matchs
  indiceTouches: Number,   // Indice de touches
  categorie: String,       // JUNIOR, SENIOR
  pushToken: String?,      // Token pour notifications push
  createdAt: Date,         // Date de création
  updatedAt: Date          // Dernière modification
}
```

#### ⚔️ Duel
```javascript
{
  id: Number,                  // Identifiant unique
  provocateurId: Number,       // ID du provocateur
  adversaireId: Number,        // ID de l'adversaire
  arbitreId: Number?,          // ID de l'arbitre (optionnel)
  etat: String,                // PROPOSE, ACCEPTE, REFUSE, A_JOUER, EN_ATTENTE_VALIDATION, VALIDE, ANNULE
  dateProposition: Date,       // Date de proposition
  dateAcceptation: Date?,      // Date d'acceptation
  dateValidation: Date?,       // Date de validation
  dateProgrammee: Date?,       // Date programmée du duel
  scoreProvocateur: Number?,   // Score final du provocateur
  scoreAdversaire: Number?,    // Score final de l'adversaire
  touchesProvocateur: Number?, // Touches du provocateur
  touchesAdversaire: Number?,  // Touches de l'adversaire
  notes: String?,              // Notes du duel
  raisonRefus: String?,        // Raison du refus
  createdAt: Date,             // Date de création
  updatedAt: Date              // Dernière modification
}
```

#### ✅ ValidationScore
```javascript
{
  id: Number,              // Identifiant unique
  duelId: Number,          // ID du duel concerné
  validateurId: Number,    // ID du validateur (joueur ou arbitre)
  scoreProvocateur: Number, // Score proposé pour le provocateur
  scoreAdversaire: Number,  // Score proposé pour l'adversaire
  touchesProvocateur: Number, // Touches proposées provocateur
  touchesAdversaire: Number,  // Touches proposées adversaire
  estAccepte: Boolean,     // Score accepté par l'autre partie
  dateProposition: Date,   // Date de proposition du score
  dateAcceptation: Date?,  // Date d'acceptation
  createdAt: Date,         // Date de création
  updatedAt: Date          // Dernière modification
}
```

#### 📨 EmailInvitation
```javascript
{
  id: Number,               // Identifiant unique
  email: String,            // Email de l'invité
  token: String,            // Token unique d'invitation
  invitePar: Number,        // ID de l'inviteur
  dateInvitation: Date,     // Date d'envoi
  dateExpiration: Date,     // Date d'expiration
  estUtilise: Boolean,      // Invitation utilisée
  dateUtilisation: Date?,   // Date d'utilisation
  utilisePar: Number?,      // ID de l'utilisateur créé
  createdAt: Date,          // Date de création
  updatedAt: Date           // Dernière modification
}
```

## 🛡️ Sécurité et Middleware

### Middlewares de Sécurité
- **Helmet** : Headers de sécurité HTTP
- **CORS** : Contrôle d'accès cross-origin configurable
- **Rate Limiting** : 1000 requêtes/minute (configurable)
- **Validation** : Joi + express-validator sur toutes les entrées
- **Authentication** : JWT pour utilisateurs et admins
- **Localhost Only** : Routes sensibles restreintes au localhost

### Configuration CORS
```javascript
allowedOrigins: [
  'https://duel.benribs.fr',
  'https://api-duel.benribs.fr', 
  'http://localhost:5173',
  'http://localhost:3003'
]
```

### Rate Limiting
- **Limite** : 1000 requêtes par minute par IP
- **Exception** : Routes admin exemptées
- **Configurable** via `RATE_LIMIT_MAX_REQUESTS`

## 📊 Monitoring et Logs

### Health Check
```javascript
GET /api/health
{
  "status": "healthy",
  "timestamp": "2025-01-XX",
  "uptime": 3600,
  "environment": "production",
  "docker": true
}
```

### Logs
- **Morgan** : Logs HTTP en mode combiné
- **Prisma** : Logs SQL en développement
- **Console** : Erreurs et events importants
- **Tracking** : Events utilisateur via `/api/track`

## 📦 Structure du Projet

```
src/
├── server.js              # Point d'entrée et configuration Express
├── database.js            # Configuration Prisma et gestion multi-DB
├── controllers/            # Logique métier par domaine
│   ├── duellistesController.js
│   ├── duelsController.js
│   ├── classementController.js
│   ├── authController.js
│   ├── adminController.js
│   ├── adminDuelsController.js
│   ├── uploadController.js
│   └── usersController.js
├── routes/                 # Définition des routes REST
│   ├── duellistes.js
│   ├── duels.js
│   ├── classement.js
│   ├── auth.js
│   ├── admin.js
│   ├── adminAuth.js
│   ├── adminDatabase.js
│   ├── adminDuels.js
│   ├── adminInvitations.js
│   ├── upload.js
│   ├── users.js
│   ├── invitations.js
│   └── tracking.js
├── services/               # Services métier et utilitaires
│   ├── databaseConfigService.js
│   └── pushNotificationService.js
├── middleware/             # Middlewares personnalisés
│   ├── auth.js
│   ├── adminAuth.js
│   ├── localhostOnly.js
│   ├── upload.js
│   └── validation.js
└── uploads/                # Fichiers uploadés
    └── avatars/

prisma/
├── schema.prisma           # Schéma actuel (SQLite ou MySQL)
├── schema.mysql.prisma     # Schéma MySQL de référence
├── schema.sqlite.prisma    # Schéma SQLite de référence
├── seed.js                # Données de test
├── dev.db                 # Base SQLite de développement
└── migrations/            # Migrations Prisma
```

## 🔧 Configuration Avancée

### Variables d'Environnement Complètes

```bash
# Serveur
NODE_ENV=development|production
PORT=3003
DOCKER_ENV=true|false

# Base de données dynamique
DB_PROVIDER=sqlite|mysql
DATABASE_URL=url_de_connexion_automatique

# MySQL (pour migration)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=duel
DB_USER=username
DB_PASS=password

# SQLite
SQLITE_URL="file:./prisma/dev.db"

# Sécurité
JWT_SECRET=votre_secret_jwt_super_securise
ADMIN_JWT_SECRET=votre_secret_admin_different

# CORS
ALLOWED_ORIGINS=https://domain1.com,https://domain2.com

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=60000

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Firebase (notifications push)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key
```

### Scripts NPM

| Script | Description |
|--------|-------------|
| `npm start` | Démarre en mode production |
| `npm run dev` | Mode développement avec nodemon |
| `npm run build` | Build et vérifications (Prisma + lint) |
| `npm run db:generate` | Génère le client Prisma |
| `npm run db:push` | Synchronise le schéma avec la DB |
| `npm run db:migrate` | Applique les migrations |
| `npm run db:studio` | Lance Prisma Studio |
| `npm run db:seed` | Alimente avec des données de test |
| `npm test` | Lance les tests Jest |
| `npm run lint` | Vérification ESLint |
| `npm run lint:fix` | Correction automatique ESLint |

## 🚀 Déploiement

### Docker (Recommandé)
```yaml
# docker-compose.yml
services:
  duel-api:
    build: ./duel-api
    ports:
      - "3003:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
    volumes:
      - sqlite_data:/app/prisma
      - uploads_data:/app/uploads
```

### VPS/Serveur Dédié
1. **Cloner et installer**
```bash
git clone https://github.com/BenribsLab/duelByBenribsLab.git
cd duelByBenribsLab/duel-api
npm ci --only=production
```

2. **Configuration production**
```bash
cp .env.example .env
# Éditer .env avec les valeurs de production
```

3. **Base de données**
```bash
npm run db:generate
npm run db:push
```

4. **Démarrage avec PM2**
```bash
npm install -g pm2
pm2 start src/server.js --name "duel-api"
pm2 startup
pm2 save
```

### Variables d'Environnement Production
```bash
NODE_ENV=production
PORT=3003
DATABASE_URL="mysql://user:pass@localhost:3306/duel_prod"
JWT_SECRET="secret_production_tres_securise"
ALLOWED_ORIGINS="https://duel.votre-domaine.com"
RATE_LIMIT_MAX_REQUESTS=500
```

## 🧪 Tests et Développement

### Tests
```bash
# Tests unitaires
npm test

# Tests avec coverage
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

### Développement
```bash
# Base de données de développement
npm run db:studio  # Interface web Prisma

# Logs en temps réel
npm run dev

# Reset base de développement
rm prisma/dev.db
npm run db:push
npm run db:seed
```

### Migration SQLite → MySQL
1. **Interface web** : `http://localhost:3003/admin/system`
2. **Étapes automatiques** :
   - Test de connexion MySQL
   - Création des tables
   - Vérification du contenu
   - Migration des données (3 modes)
   - Finalisation et redémarrage

## 📚 Exemples d'Utilisation

### Créer un Dueliste
```javascript
POST /api/duellistes
{
  "pseudo": "Zorro",
  "avatarUrl": "https://example.com/avatar.jpg",
  "categorie": "SENIOR"
}
```

### Proposer un Duel
```javascript
POST /api/duels
{
  "provocateurId": 1,
  "adversaireId": 2,
  "arbitreId": 3,
  "dateProgrammee": "2025-01-15T14:00:00Z",
  "notes": "Duel de championnat"
}
```

### Saisir un Score
```javascript
POST /api/duels/1/score
{
  "scoreProvocateur": 15,
  "scoreAdversaire": 12,
  "touchesProvocateur": 18,
  "touchesAdversaire": 16
}
```

## 🤝 Contribution

1. Fork le repository
2. Créer une branche feature (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit vos changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📝 Licence

MIT - **Benribs Lab** © 2025

---

**🤺 Développé avec passion pour la communauté de l'escrime !**