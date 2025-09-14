Write-Host "🤺 Duel by Benribs Lab - Configuration rapide" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Créer le fichier .env à partir de l'exemple
if (-Not (Test-Path ".env")) {
    Write-Host "📝 Création du fichier .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Fichier .env créé" -ForegroundColor Green
} else {
    Write-Host "⚠️ Le fichier .env existe déjà" -ForegroundColor Yellow
}

# Installer les dépendances
Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'installation des dépendances" -ForegroundColor Red
    exit 1
}

# Générer le client Prisma
Write-Host "🔧 Génération du client Prisma..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de la génération du client Prisma" -ForegroundColor Red
    exit 1
}

# Créer/synchroniser la base de données
Write-Host "🗄️ Initialisation de la base de données..." -ForegroundColor Yellow
npx prisma db push

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'initialisation de la base de données" -ForegroundColor Red
    exit 1
}

# Alimenter avec des données de test
Write-Host "🌱 Insertion des données de test..." -ForegroundColor Yellow
npm run db:seed

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'insertion des données de test" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Configuration terminée !" -ForegroundColor Green
Write-Host ""
Write-Host "Pour démarrer le serveur :" -ForegroundColor Cyan
Write-Host "  npm run dev    (mode développement)" -ForegroundColor White
Write-Host "  npm start      (mode production)" -ForegroundColor White
Write-Host ""
Write-Host "Endpoints disponibles :" -ForegroundColor Cyan
Write-Host "  http://localhost:3003/health" -ForegroundColor White
Write-Host "  http://localhost:3003/api/duellistes" -ForegroundColor White
Write-Host "  http://localhost:3003/api/duels" -ForegroundColor White
Write-Host "  http://localhost:3003/api/classement" -ForegroundColor White
Write-Host ""
Write-Host "Interface de base de données :" -ForegroundColor Cyan
Write-Host "  npm run db:studio" -ForegroundColor White