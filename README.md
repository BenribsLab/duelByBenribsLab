# Duel by Benribs Lab 🤺

## � Démarrage rapide

### Avec Docker (Recommandé)

```bash
# Mode production complet (avec MySQL)
./start.sh

# Mode développement (SQLite uniquement)  
./start-dev.sh

# Ou manuellement
docker-compose up -d
```

### Mode développement local

```bash
# Backend
cd duel-api
npm install
npm run dev

# Frontend (nouveau terminal)
cd duel-frontend  
npm install
npm run dev
```

## �️ Architecture

- **Frontend** : React + Vite (port 80 en prod, 5173 en dev)
- **Backend** : Node.js + Express + Prisma (port 3000)
- **Base de données** : SQLite (par défaut) + MySQL (optionnel)

## 🔄 Switch de base de données

L'application supporte le basculement dynamique entre SQLite et MySQL :

1. Accéder à `/admin` 
2. Utiliser le switch SQLite/MySQL
3. **En mode Docker** : redémarrage automatique du container
4. **En mode local** : redémarrage manuel requis

## 📁 Structure du projet

```
/
├── docker-compose.yml         # Production avec MySQL
├── docker-compose.dev.yml     # Développement SQLite only
├── start.sh                   # Script démarrage production
├── start-dev.sh               # Script démarrage développement
├── DOCKER.md                  # Documentation Docker complète
├── duel-api/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── src/
└── duel-frontend/
    ├── Dockerfile
    ├── .dockerignore
    ├── nginx.conf
    └── src/
```

**Exemple** :
```
Pseudo: "ZorroMask" ou "Pierre D."
Avatar: [image optionnelle]
```

### ⚔️ Duel
Gestion complète du cycle de vie d'un affrontement :

**Participants** :
- **Provocateur** (Joueur A) : Celui qui lance le défi
- **Adversaire** (Joueur B) : Celui qui reçoit la provocation

**États possibles** :
1. `proposé` : Duel lancé, en attente de réponse
2. `accepté` : Adversaire a accepté, prêt à jouer
3. `refusé` : Adversaire a décliné
4. `à jouer` : Duel programmé et accepté
5. `en attente validation` : Scores saisis, validation en cours
6. `validé` : Duel terminé et comptabilisé

**Métadonnées** :
- **Date** : Optionnelle, peut rester "libre" pour flexibilité
- **Arbitre/témoin** : Assignable optionnel, modifiable jusqu'à validation

### 📊 Résultat
Système de scoring simple et efficace :

**Scores** :
- Score Joueur A (nombre entier)
- Score Joueur B (nombre entier)
- **Contrainte** : Pas d'égalité possible (un joueur doit toujours gagner)

**Validation** :
- **Mode Arbitre** : L'arbitre/témoin saisit → validation immédiate
- **Mode Joueurs** : Double saisie concordante → validation automatique

**Exemples de scores valides** :
- 5–3, 10–8, 15–12, 20–18

## 📏 Règles de validation

### 🎯 Validation par Arbitre/Témoin
- L'arbitre saisit le score final
- Validation immédiate sans confirmation des joueurs
- Score fait foi définitivement

### 👥 Validation par Double Saisie
1. Chaque joueur saisit le score de son côté
2. Si les deux saisies correspondent → validation automatique
3. Si divergence → signalement et résolution manuelle

## 🏆 Système de Classement

### 📊 Critères hiérarchiques (par ordre de priorité)

1. **Victoires** (critère principal et absolu)
   - Nombre total de matchs gagnés
   - Critère déterminant principal

2. **Taux de victoire** (critère de départage)
   - Formule : `victoires ÷ matchs joués`
   - Permet de départager les égalités en victoires

3. **Indice touches** (critère tertiaire)
   - Formule : `touches données - touches reçues`
   - **Plafonnement** : Maximum ±5 par duel (évite les scores extrêmes)
   - Utilisé uniquement en cas d'égalité parfaite

### 📈 Exemple de classement

| Joueur | Victoires | Matchs | Taux | Indice | Position |
|--------|-----------|--------|------|--------|----------|
| Bob    | 12        | 18     | 0,67 | +12    | 1er      |
| Alice  | 12        | 20     | 0,60 | +8     | 2ème     |
| Claire | 11        | 22     | 0,50 | +25    | 3ème     |

**Explication** :
- Bob devant Alice : même victoires, meilleur taux
- Claire derrière : moins de victoires malgré plus d'activité

## 🎮 Fonctionnalités principales

### ⚔️ Gestion des défis
- Interface de provocation intuitive
- Système de notifications pour les défis
- Calendrier des duels programmés

### 📝 Saisie des résultats
- Interface de scoring simple
- Validation en temps réel
- Historique des matchs

### 📊 Tableaux de bord
- Classement général en temps réel
- Statistiques personnelles
- Historique des confrontations

## 🛠️ Spécifications techniques

### 💾 Base de données
Tables principales :
- `duel_duellistes` : Profils des escrimeurs
- `duel_matchs` : Duels et leurs états
- `duel_resultats` : Scores et validations

### 🔌 Intégration WordPress
- Plugin autonome compatible multi-sites
- Shortcodes pour intégration dans pages/articles
- Interface d'administration dédiée

## 🎯 Philosophie du projet

### ⚖️ Égalité et Accessibilité
- **Défi universel** : Tout le monde peut défier tout le monde
- **Pas de barrières** : Aucune restriction d'âge ou de catégorie
- **Autonomie** : Les joueurs gèrent leurs propres affrontements

### 🏅 Récompenses équilibrées
- **Victoires avant tout** : Critère principal incontournable
- **Efficacité valorisée** : Taux de victoire récompensé
- **Qualité technique** : Indice touches comme bonus

### 🤝 Fair-play et Transparence
- **Validation collaborative** : Pas de hiérarchie externe imposée
- **Règles d'escrime respectées** : Application des règles traditionnelles
- **Transparence totale** : Tous les résultats visibles par tous

## 🚀 Phases de développement

### Phase 1 : MVP (Minimum Viable Product)
- Gestion des duellistes
- Système de défis basique
- Saisie et validation des résultats
- Classement simple

### Phase 2 : Améliorations
- Interface utilisateur avancée
- Notifications et calendrier
- Statistiques détaillées
- Système de badges/récompenses

### Phase 3 : Extensions
- Tournois organisés
- Analyse des performances
- Intégration réseaux sociaux
- API pour applications mobiles

---

**Développé avec ❤️ pour la communauté de l'escrime**