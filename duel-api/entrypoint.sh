#!/bin/bash
set -e

echo "🔧 Configuration de la base de données..."
node -e "require('./src/database.js')"

echo "🔧 Génération du client Prisma..."
npx prisma generate

echo "🔧 Initialisation de la base de données..."
npx prisma db push

echo "🚀 Démarrage du serveur..."
exec "$@"