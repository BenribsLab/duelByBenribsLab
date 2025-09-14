# 🤺 Duel by Benribs Lab - API Backend

API REST pour l'application de gestion de duels d'escrime.

## 🚀 Démarrage rapide

### Prérequis
- Node.js >= 16.0.0
- npm >= 8.0.0

### Installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer l'environnement**
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer .env avec vos paramètres
```

3. **Initialiser la base de données**
```bash
# Générer le client Prisma
npm run db:generate

# Créer/mettre à jour la base de données
npm run db:push

# Alimenter avec des données de test
npm run db:seed
```

4. **Démarrer le serveur**
```bash
# Mode développement (avec rechargement automatique)
npm run dev

# Mode production
npm start
```

L'API sera accessible sur : http://localhost:3003

## 📋 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm start` | Démarre le serveur en mode production |
| `npm run dev` | Démarre en mode développement avec nodemon |
| `npm run db:generate` | Génère le client Prisma |
| `npm run db:push` | Synchronise le schéma avec la base |
| `npm run db:migrate` | Applique les migrations |
| `npm run db:studio` | Lance Prisma Studio (interface web) |
| `npm run db:seed` | Alimente la base avec des données de test |
| `npm test` | Lance les tests |
| `npm run lint` | Vérifie le code avec ESLint |

## 🗄️ Base de données

### Modèles principaux

#### Dueliste
- `id` : Identifiant unique
- `pseudo` : Nom d'affichage (unique)
- `avatarUrl` : URL de l'avatar (optionnel)
- `statut` : ACTIF, INACTIF, SUSPENDU
- Statistiques : victoires, défaites, indice touches

#### Duel
- `id` : Identifiant unique
- Relations : provocateur, adversaire, arbitre (optionnel)
- `etat` : PROPOSE, ACCEPTE, REFUSE, A_JOUER, EN_ATTENTE_VALIDATION, VALIDE, ANNULE
- Scores et validation
- Dates de proposition, acceptation, validation

#### ValidationScore
- Système de double validation des scores
- Permet la saisie par chaque joueur ou par l'arbitre

### Voir le schéma complet
```bash
npm run db:studio
```

## 🛡️ Sécurité

- **Helmet** : Headers de sécurité
- **CORS** : Contrôle d'accès cross-origin
- **Rate limiting** : Limitation du nombre de requêtes
- **Validation** : Vérification des données avec Joi
- **JWT** : Authentification par tokens (à implémenter)

## 📊 Monitoring

- **Morgan** : Logs des requêtes HTTP
- **Health check** : Endpoint `/health`
- **Prisma logs** : Requêtes SQL en mode développement

## 🔧 Configuration

Toute la configuration se fait via les variables d'environnement dans `.env` :

- `PORT` : Port du serveur (défaut: 3003)
- `DATABASE_URL` : URL SQLite (défaut: file:./dev.db)
- `JWT_SECRET` : Secret pour les tokens JWT
- `ALLOWED_ORIGINS` : Domaines autorisés pour CORS
- `RATE_LIMIT_*` : Configuration du rate limiting

## 📡 Endpoints (à venir)

### Duellistes
- `GET /api/duellistes` : Liste des duellistes
- `POST /api/duellistes` : Créer un dueliste
- `GET /api/duellistes/:id` : Détails d'un dueliste
- `PUT /api/duellistes/:id` : Modifier un dueliste

### Duels
- `GET /api/duels` : Liste des duels
- `POST /api/duels` : Proposer un duel
- `PUT /api/duels/:id/accept` : Accepter un duel
- `PUT /api/duels/:id/refuse` : Refuser un duel
- `PUT /api/duels/:id/score` : Saisir un score

### Classement
- `GET /api/classement` : Classement général
- `GET /api/classement/:id` : Statistiques d'un dueliste

## 🧪 Tests

```bash
# Lancer tous les tests
npm test

# Tests en mode watch
npm run test:watch

# Coverage
npm run test:coverage
```

## 📦 Structure du projet

```
src/
├── server.js          # Point d'entrée principal
├── database.js        # Configuration Prisma
├── controllers/       # Logique métier
├── routes/           # Définition des routes
├── services/         # Services métier
└── middleware/       # Middlewares personnalisés

prisma/
├── schema.prisma     # Schéma de base de données
└── seed.js          # Données de test
```

## 🚀 Déploiement

### Sur VPS
1. Cloner le repository
2. Installer les dépendances
3. Configurer `.env` pour la production
4. Initialiser la base de données
5. Démarrer avec PM2 ou systemd

### Variables d'environnement production
```bash
NODE_ENV=production
PORT=3003
DATABASE_URL="file:/path/to/production/duel.db"
JWT_SECRET="votre_secret_tres_securise"
ALLOWED_ORIGINS="https://votre-site.com"
```

## 📝 Licence

MIT - Benribs Lab