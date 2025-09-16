#!/bin/bash
set -e

echo "🔧 Génération du client Prisma..."
npx prisma generate

echo "🔧 Initialisation de la base de données..."
npx prisma db push

echo "🚀 Démarrage du serveur..."
exec "$@"