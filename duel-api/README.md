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

### 👥 Duellistes (`/api/duellistes`) 🔒 **ROUTES SÉCURISÉES**
> **✅ SÉCURISÉ :** Ces routes nécessitent une authentification JWT. Accès autorisé uniquement aux utilisateurs connectés.

- `GET /` - Liste tous les duellistes **[AUTHENTIFICATION REQUISE]**
  - **Query params** : `page`, `limit`, `search`, `categorie`
  - **Headers** : `Authorization: Bearer <token>`
- `GET /:id` - Détails d'un dueliste **[AUTHENTIFICATION REQUISE]**
- `POST /` - Créer un nouveau dueliste **[AUTHENTIFICATION REQUISE]**
  - **Body** : `pseudo`, `avatarUrl?`, `categorie?`
  - **Headers** : `Authorization: Bearer <token>`
- `PUT /:id` - Modifier un dueliste **[AUTHENTIFICATION REQUISE]**
  - **Headers** : `Authorization: Bearer <token>`
- `DELETE /:id` - Supprimer un dueliste **[AUTHENTIFICATION REQUISE]**
  - **Headers** : `Authorization: Bearer <token>`

### ⚔️ Duels (`/api/duels`) 🔒 **ROUTES SÉCURISÉES**
> **✅ SÉCURISÉ :** Ces routes nécessitent une authentification JWT. Accès autorisé uniquement aux utilisateurs connectés.

- `GET /` - Liste tous les duels **[AUTHENTIFICATION REQUISE]**
  - **Query params** : `page`, `limit`, `etat`, `duelisteId`
  - **Headers** : `Authorization: Bearer <token>`
- `GET /:id` - Détails d'un duel **[AUTHENTIFICATION REQUISE]**
  - **Headers** : `Authorization: Bearer <token>`
- `POST /` - Proposer un nouveau duel **[AUTHENTIFICATION REQUISE]**
  - **Body** : `provocateurId`, `adversaireId`, `arbitreId?`, `dateProgrammee?`, `notes?`
  - **Headers** : `Authorization: Bearer <token>`
- `PUT /:id/accepter` - Accepter un duel proposé **[AUTHENTIFICATION REQUISE]**
  - **Headers** : `Authorization: Bearer <token>`
- `PUT /:id/refuser` - Refuser un duel proposé **[AUTHENTIFICATION REQUISE]**
  - **Body** : `raison?`
  - **Headers** : `Authorization: Bearer <token>`
- `POST /:id/score` - Saisir un score **[AUTHENTIFICATION REQUISE]**
  - **Body** : `scoreProvocateur`, `scoreAdversaire`, `touchesProvocateur`, `touchesAdversaire`
  - **Headers** : `Authorization: Bearer <token>`
- `GET /:id/proposition-score` - Voir les propositions de score en attente **[AUTHENTIFICATION REQUISE]**
  - **Headers** : `Authorization: Bearer <token>`
- `PUT /:id/accepter-score` - Accepter une proposition de score **[AUTHENTIFICATION REQUISE]**
  - **Headers** : `Authorization: Bearer <token>`

### 🏆 Classement (`/api/classement`) 🌍 **ROUTES PUBLIQUES**
> **ℹ️ PUBLIC :** Ces routes sont accessibles sans authentification pour afficher les statistiques publiques.

- `GET /` - Classement général **[PUBLIC]**
  - **Query params** : `categorie` (JUNIOR|SENIOR), `limit` (nombre de résultats)
- `GET /junior` - Classement des juniors **[PUBLIC]**
  - **Query params** : `limit`
- `GET /stats/globales` - Statistiques globales **[PUBLIC]**
- `GET /dueliste/:id` - Statistiques détaillées d'un dueliste **[PUBLIC]**
- `POST /recalculer` - Recalculer les statistiques **[ADMIN UNIQUEMENT]**

### 📤 Upload (`/api/upload`) 🔒 **ROUTES SÉCURISÉES**
> **✅ SÉCURISÉ :** Upload de fichiers réservé aux utilisateurs authentifiés.

- `POST /avatar` - Upload d'avatar **[AUTHENTIFICATION REQUISE]**
  - **File** : image (PNG, JPG, JPEG, WebP)
  - **Size limit** : 5MB
  - **Headers** : `Authorization: Bearer <token>`
- `DELETE /avatar` - Supprimer l'avatar **[AUTHENTIFICATION REQUISE]**
  - **Headers** : `Authorization: Bearer <token>`

### 🔐 Authentification (`/api/auth`) 🌍 **ROUTES PUBLIQUES**
> **ℹ️ PUBLIC :** Routes d'authentification accessibles sans token (sauf `/me`).

- `POST /register` - Inscription **[PUBLIC]**
  - **Body** : `email`, `password`, `pseudo`
- `POST /login` - Connexion **[PUBLIC]**
  - **Body** : `email`, `password`
- `POST /verify-otp` - Vérification OTP **[PUBLIC]**
  - **Body** : `email`, `otp`
- `GET /me` - Profil utilisateur **[AUTHENTIFICATION REQUISE]**
  - **Headers** : `Authorization: Bearer <token>`
- `POST /logout` - Déconnexion **[PUBLIC]**

### 📨 Invitations (`/api/invitations`) 🔒 **ROUTES SÉCURISÉES**
> **✅ SÉCURISÉ :** Envoi d'invitations réservé aux utilisateurs authentifiés.

- `POST /email` - Envoyer une invitation par email **[AUTHENTIFICATION REQUISE]**
  - **Body** : `email`, `recipientName?`
  - **Headers** : `Authorization: Bearer <token>`

### 👤 Utilisateurs (`/api/users`) 🔒 **ROUTES SÉCURISÉES**
> **✅ SÉCURISÉ :** Gestion des tokens push pour les notifications.

- `POST /:id/push-token` - Enregistrer token FCM **[AUTHENTIFICATION REQUISE]**
  - **Body** : `pushToken`, `platform?` (web|android|ios)
  - **Headers** : `Authorization: Bearer <token>`
- `DELETE /:id/push-token` - Supprimer token FCM **[AUTHENTIFICATION REQUISE]**
  - **Headers** : `Authorization: Bearer <token>`

### 📊 Tracking (`/api/track`) 🌍 **ROUTES PUBLIQUES**
> **ℹ️ PUBLIC :** Routes de tracking anonymes pour les statistiques.

- `GET /email-open/:invitationId` - Tracker ouverture email **[PUBLIC]**
- `POST /click/:invitationId` - Tracker clic sur lien **[PUBLIC]**

### 👑 Administration (`/api/admin`) 🔒 **ACCÈS ADMIN UNIQUEMENT**
> **🔐 SUPER-SÉCURISÉ :** Toutes les routes admin nécessitent une authentification administrateur spéciale.

#### Authentification Admin (`/api/admin/auth`) 🌍
- `POST /login` - Connexion admin **[PUBLIC]**
  - **Body** : `email`, `password`
- `POST /refresh` - Renouveler token admin **[PUBLIC]**

#### Gestion Générale (`/api/admin`) 🔒
- `GET /users` - Liste des utilisateurs **[ADMIN]**
  - **Query params** : `page`, `limit`, `search`
  - **Headers** : `Authorization: Bearer <admin_token>`
- `GET /search` - Recherche globale **[ADMIN]**
  - **Query params** : `q` (terme de recherche), `type` (users|duellistes|duels)

#### Gestion des Duels (`/api/admin/duels`) 🔒
- `GET /` - Liste complète des duels avec filtres admin **[ADMIN]**
  - **Query params** : `page`, `limit`, `etat`, `search`
  - **Headers** : `Authorization: Bearer <admin_token>`
- `GET /statistiques` - Statistiques des duels **[ADMIN]**
- `DELETE /:id` - Supprimer un duel **[ADMIN]**
  - **Body** : `raison` (raison de suppression)
- `PUT /:id/forcer-validation` - Forcer la validation d'un duel **[ADMIN]**
  - **Body** : `scoreProvocateur`, `scoreAdversaire`, `touchesProvocateur`, `touchesAdversaire`

#### Gestion des Invitations (`/api/admin/invitations`) 🔒
- `GET /` - Liste des invitations **[ADMIN]**
  - **Query params** : `page`, `limit`, `status`, `search`
  - **Headers** : `Authorization: Bearer <admin_token>`
- `GET /stats` - Statistiques des invitations **[ADMIN]**
- `POST /:id/resend` - Renvoyer une invitation **[ADMIN]**
- `DELETE /:id` - Supprimer une invitation **[ADMIN]**
- `POST /bulk-delete` - Suppression en lot **[ADMIN]**
  - **Body** : `ids[]` (array d'IDs à supprimer)

#### Migration de Base de Données (`/api/admin/database`) 🔒
> **⚠️ LOCALHOST UNIQUEMENT :** Ces routes sont restreintes à `localhost` pour des raisons de sécurité.

- `GET /config` - Configuration actuelle de la DB **[LOCALHOST ONLY]**
- `POST /test-connection` - Tester une connexion DB **[LOCALHOST ONLY]**
  - **Body** : `provider`, `host`, `port`, `database`, `user`, `password`
- `POST /check-tables` - Vérifier les tables existantes **[LOCALHOST ONLY]**
- `POST /create-tables` - Créer les tables manquantes **[LOCALHOST ONLY]**
- `POST /check-content` - Vérifier le contenu des tables **[LOCALHOST ONLY]**
- `POST /migrate-data` - Migrer les données **[ADMIN + LOCALHOST]**
  - **Body** : `mode` (fusion|ecrasement|skip), `config` (DB target)
- `POST /finalize-migration` - Finaliser la migration **[LOCALHOST ONLY]**
- `POST /switch` - Basculer vers la nouvelle DB **[LOCALHOST ONLY]**
- `GET /providers` - Liste des providers supportés **[PUBLIC]**

## 🔐 Sécurité et Authentification

### 🎯 Niveaux de Sécurité

**🌍 PUBLIC** : Accessible sans authentification
- Routes d'authentification (`/auth/login`, `/auth/register`)
- Classements et statistiques (`/classement/*`)
- Tracking anonyme (`/track/*`)

**🔒 AUTHENTIFICATION REQUISE** : Token JWT utilisateur nécessaire
- Gestion des duellistes (`/duellistes/*`)
- Gestion des duels (`/duels/*`)
- Upload de fichiers (`/upload/*`)
- Gestion du profil (`/users/*`)
- Invitations (`/invitations/*`)

**🔐 ADMIN UNIQUEMENT** : Token JWT administrateur nécessaire
- Toutes les routes `/admin/*` (sauf `/admin/auth`)
- Supervision et modération
- Gestion avancée

**🏠 LOCALHOST UNIQUEMENT** : Accès restreint à l'IP locale
- Migration de base de données (`/admin/database/*`)
- Configuration système critique

### 🔑 Authentification JWT

#### Utilisateurs Standard
```bash
# Obtenir un token
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

# Utiliser le token
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Administrateurs
```bash
# Obtenir un token admin
POST /api/admin/auth/login
{
  "email": "admin@example.com",
  "password": "admin_password"
}

# Utiliser le token admin
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 🛡️ Protection et Middlewares
- **Helmet** : Protection des headers HTTP
- **CORS** : Configuration cross-origin sécurisée
- **Rate Limiting** : Protection contre les attaques par déni de service
- **Validation stricte** : Toutes les entrées sont validées
- **Sanitisation** : Protection contre les injections XSS/SQL

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