#!/bin/bash

echo "🔧 Vérification de la base de données..."
cd duel-api

if [ ! -f "prisma/dev.db" ]; then
    echo "📁 Base de données non trouvée, création..."
    npx prisma db push
    echo "✅ Base de données créée"
else
    echo "✅ Base de données existante trouvée"
fi

cd ..

echo "🚀 Lancement de Docker..."
docker compose up -d --build