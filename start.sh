#!/bin/bash

# Script de démarrage pour l'environnement de production
echo "🚀 Démarrage de l'application Duel by Benribs Lab en mode production"

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Build et démarrage des services
echo "📦 Construction des images Docker..."
docker-compose build

echo "🔄 Démarrage des services..."
docker-compose up -d

echo "⏳ Attente du démarrage des services..."
sleep 10

# Vérification de l'état des services
echo "🔍 Vérification de l'état des services..."
docker-compose ps

echo "✅ Application démarrée !"
echo "🌐 Frontend disponible sur : http://localhost:5173"
echo "🔌 API disponible sur : http://localhost:3001"
echo "🗄️  Base de données : SQLite (par défaut)"
echo "🔄 Switch MySQL externe : via /admin dans l'interface"
echo ""
echo "📋 Commandes utiles :"
echo "  - Voir les logs : docker-compose logs -f"
echo "  - Arrêter l'application : docker-compose down"
echo "  - Redémarrer : docker-compose restart"