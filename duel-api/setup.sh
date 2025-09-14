#!/bin/bash

echo "🤺 Duel by Benribs Lab - Configuration rapide"
echo "============================================="

# Créer le fichier .env à partir de l'exemple
if [ ! -f .env ]; then
    echo "📝 Création du fichier .env..."
    cp .env.example .env
    echo "✅ Fichier .env créé"
else
    echo "⚠️ Le fichier .env existe déjà"
fi

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Générer le client Prisma
echo "🔧 Génération du client Prisma..."
npx prisma generate

# Créer/synchroniser la base de données
echo "🗄️ Initialisation de la base de données..."
npx prisma db push

# Alimenter avec des données de test
echo "🌱 Insertion des données de test..."
npm run db:seed

echo ""
echo "🎉 Configuration terminée !"
echo ""
echo "Pour démarrer le serveur :"
echo "  npm run dev    (mode développement)"
echo "  npm start      (mode production)"
echo ""
echo "Endpoints disponibles :"
echo "  http://localhost:3001/health"
echo "  http://localhost:3001/api/duellistes"
echo "  http://localhost:3001/api/duels"
echo "  http://localhost:3001/api/classement"
echo ""
echo "Interface de base de données :"
echo "  npm run db:studio"