#!/bin/bash

# Script de démarrage pour l'environnement de développement
echo "🚀 Démarrage de l'application Duel by Benribs Lab en mode développement"

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez l'installer avant de continuer."
    exit 1
fi

# Build et démarrage des services en mode dev
echo "📦 Construction des images Docker pour le développement..."
docker-compose -f docker-compose.dev.yml build

echo "🔄 Démarrage des services en mode développement..."
docker-compose -f docker-compose.dev.yml up -d

echo "⏳ Attente du démarrage des services..."
sleep 10

# Vérification de l'état des services
echo "🔍 Vérification de l'état des services..."
docker-compose -f docker-compose.dev.yml ps

echo "✅ Application de développement démarrée !"
echo "🌐 Frontend disponible sur : http://localhost:5173"
echo "🔌 API disponible sur : http://localhost:3003"
echo "🗄️  Base de données : SQLite (développement)"
echo ""
echo "📋 Commandes utiles :"
echo "  - Voir les logs : docker-compose -f docker-compose.dev.yml logs -f"
echo "  - Arrêter l'application : docker-compose -f docker-compose.dev.yml down"
echo "  - Redémarrer : docker-compose -f docker-compose.dev.yml restart"