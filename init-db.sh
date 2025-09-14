#!/bin/bash

echo "🔧 Création de la base de données..."
cd duel-api

if [ ! -f "prisma/dev.db" ]; then
    echo "📁 Création de la base de données..."
    export DATABASE_URL="file:./dev.db"
    cd prisma
    npx prisma db push
    cd ..
    
    if [ -f "prisma/dev.db" ]; then
        echo "✅ Base de données créée dans prisma/dev.db"
    else
        echo "❌ Erreur lors de la création de la base de données"
    fi
else
    echo "✅ Base de données déjà existante"
fi

cd ..