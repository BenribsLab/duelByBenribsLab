# Duel by Benribs Lab - Docker Setup

## 🐳 Architecture Docker

Cette application utilise une architecture microservices avec Docker Compose :

- **Frontend** : React + Vite servi par Nginx
- **Backend** : Node.js + Express + Prisma
- **Base de données** : SQLite (par défaut) + MySQL (optionnel)

## 🚀 Démarrage rapide

### Mode Production

```bash
# Démarrer l'application complète avec MySQL
./start.sh

# Ou manuellement
docker-compose up -d
```

### Mode Développement

```bash
# Démarrer en mode développement (sans MySQL)
./start-dev.sh

# Ou manuellement
docker-compose -f docker-compose.dev.yml up -d
```

## 📋 Services disponibles

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost | Interface utilisateur React |
| API | http://localhost:3000 | API REST backend |
| MySQL | localhost:3306 | Base de données (optionnelle) |

## 🔄 Switch de base de données

L'application supporte le switch dynamique entre SQLite et MySQL via l'interface d'administration :

1. Accéder à `/admin` dans l'interface
2. Utiliser le switch SQLite/MySQL
3. **Le container de l'API redémarre automatiquement** pour appliquer les changements

### Variables d'environnement pour le switch

```env
# SQLite (par défaut)
DATABASE_URL="file:./dev.db"

# MySQL (disponible via switch)
MYSQL_HOST=mysql
MYSQL_PORT=3306
MYSQL_DATABASE=duel_db
MYSQL_USER=duel_user
MYSQL_PASSWORD=duel_password
```

## 🛠️ Commandes utiles

```bash
# Voir les logs de tous les services
docker-compose logs -f

# Voir les logs d'un service spécifique
docker-compose logs -f duel-api
docker-compose logs -f duel-frontend

# Redémarrer un service
docker-compose restart duel-api

# Entrer dans un container
docker-compose exec duel-api sh
docker-compose exec mysql mysql -u root -p

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v

# Reconstruire les images
docker-compose build --no-cache
```

## 🗄️ Gestion des données

### Volumes persistants

- `mysql_data` : Données MySQL
- `api_data` : Données de l'API
- `./duel-api/prisma` : Base SQLite et schémas Prisma

### Migrations Prisma

```bash
# Entrer dans le container API
docker-compose exec duel-api sh

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma db push

# Voir la base de données
npx prisma studio
```

## 🔧 Développement

### Bind mounts pour le hot reload

En mode développement, les fichiers source sont montés pour permettre le hot reload :

```yaml
volumes:
  - ./duel-api:/app  # Code source de l'API
  - /app/node_modules  # Exclure node_modules
```

### Debugging

```bash
# Mode développement avec logs détaillés
docker-compose -f docker-compose.dev.yml up

# Inspecter les variables d'environnement
docker-compose exec duel-api env

# Vérifier la connectivité réseau
docker-compose exec duel-api ping mysql
```

## 🚨 Troubleshooting

### Port déjà utilisé
```bash
# Trouver le processus utilisant le port 3000
sudo lsof -i :3000
sudo kill -9 <PID>
```

### Problèmes de permissions
```bash
# Réinitialiser les permissions
sudo chown -R $USER:$USER .
```

### Base de données corrompue
```bash
# Supprimer et recréer les volumes
docker-compose down -v
docker-compose up -d
```

### Cache Docker
```bash
# Nettoyer le cache Docker
docker system prune -a
```

## 🔐 Sécurité

En production, pensez à :

1. Changer les mots de passe par défaut
2. Utiliser des secrets Docker
3. Configurer un reverse proxy (Traefik, Nginx)
4. Activer HTTPS
5. Limiter l'exposition des ports