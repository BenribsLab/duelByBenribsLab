#!/bin/bash
set -e

echo "🔧 Initialisation de la base de données..."
npx prisma db push

echo "🚀 Démarrage du serveur..."
exec "$@"