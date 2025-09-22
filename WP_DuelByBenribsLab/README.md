# 🗂️ Plugin WordPress - Duel by Benribs Lab

Plugin WordPress pour intégrer les fonctionnalités de duels d'escrime directement sur votre site via des shortcodes. Les utilisateurs peuvent se connecter, gérer leurs duels, consulter le classement et afficher leur profil sans quitter WordPress.

## ✨ Fonctionnalités Principales

### 🔐 Authentification Intelligente
- **Connexion adaptative** : Détection automatique email/pseudo avec gestion OTP
- **Inscription flexible** : Choix entre authentification par email ou mot de passe
- **Sessions sécurisées** : Stockage sécurisé des tokens JWT dans les sessions PHP
- **Auto-déconnexion** : Gestion automatique des tokens expirés

### ⚔️ Gestion des Duels
- **Interface complète** : Proposition, validation et historique des duels
- **Scores en temps réel** : Saisie et validation des résultats
- **États visuels** : Indicateurs colorés pour le statut des duels
- **Filtres avancés** : Par statut, adversaire, date

### 🏆 Classements et Profils
- **Classement général** : Top des meilleurs duellistes
- **Classement junior** : Catégorie spécialisée
- **Profils détaillés** : Statistiques, avatar, rang et historique
- **Données en temps réel** : Synchronisation avec l'API

### 🎨 Intégration WordPress
- **Design responsive** : S'adapte à tous les thèmes WordPress
- **Shortcodes flexibles** : Paramètres configurables pour chaque widget
- **CSS personnalisable** : Styles adaptables au design de votre site
- **JavaScript optimisé** : Interactions AJAX fluides

## 🚀 Installation et Configuration

### 📋 Prérequis
- WordPress 5.0 ou supérieur
- PHP 7.4 ou supérieur
- Accès à l'API Duel by Benribs Lab
- Thème WordPress compatible

### 🛠️ Installation

1. **Téléchargement**
```bash
# Cloner ou télécharger le dossier
WP_DuelByBenribsLab/
```

2. **Installation sur WordPress**
```bash
# Copier dans le dossier plugins
cp -r WP_DuelByBenribsLab /wp-content/plugins/

# Ou uploader via l'admin WordPress
# Extensions > Ajouter > Téléverser
```

3. **Activation**
- Aller dans **Extensions** → **Extensions installées**
- Trouver **"Duel by Benribs Lab"**
- Cliquer sur **"Activer"**

### ⚙️ Configuration

**URL de l'API** (optionnel) :
```php
// Par défaut : https://duel.benribs.fr/api
// Configurable dans wp-config.php si nécessaire
define('DUEL_API_BASE_URL', 'https://votre-api.com/api');
```

## 🛠️ Shortcodes Disponibles

### `[duel_login]` - Formulaire de Connexion

Affiche un formulaire de connexion intelligent avec détection automatique du type d'identifiant.

**Attributs :**
- `title` : Titre du formulaire (défaut: "Connexion")
- `show_register_link` : Afficher lien inscription (défaut: "true")
- `redirect_after_login` : URL de redirection après connexion

**Exemples d'utilisation :**
```php
[duel_login]
[duel_login title="Se connecter à Duel" show_register_link="false"]
[duel_login redirect_after_login="/dashboard/"]
```

**Fonctionnement automatique :**
1. **Email saisi** → Envoi automatique code OTP
2. **Pseudo saisi** → Demande du mot de passe
3. **Connexion réussie** → Stockage sécurisé du token
4. **Redirection** → Vers l'URL configurée ou rechargement

### `[duel_register]` - Formulaire d'Inscription

Affiche un formulaire d'inscription avec choix du mode d'authentification.

**Attributs :**
- `title` : Titre du formulaire (défaut: "Inscription")
- `default_auth_mode` : Mode par défaut ("email" ou "password")
- `show_login_link` : Afficher lien connexion (défaut: "true")

**Exemples :**
```php
[duel_register]
[duel_register title="Rejoindre Duel" default_auth_mode="email"]
```

**Modes d'authentification :**
- **Mode Email/OTP** : Inscription + connexion par codes OTP
- **Mode Classique** : Inscription + connexion par mot de passe
- **Choix utilisateur** : L'utilisateur sélectionne son mode préféré

### `[duel_profile]` - Profil Utilisateur

Affiche le profil complet de l'utilisateur connecté avec ses statistiques.

**Attributs :**
- `title` : Titre du profil (défaut: "Mon Profil")
- `show_avatar` : Afficher l'avatar (défaut: "true")
- `show_stats` : Afficher les statistiques (défaut: "true")
- `show_rank` : Afficher le rang (défaut: "true")
- `show_logout` : Afficher bouton déconnexion (défaut: "true")

**Exemples :**
```php
[duel_profile]
[duel_profile title="Profil Escrimeur" show_logout="false"]
[duel_profile show_avatar="false" show_rank="false"]
```

**Informations affichées :**
- **Avatar** : Photo de profil avec upload possible
- **Statistiques** : Victoires, défaites, ratio, points ELO
- **Rang** : Position dans le classement général
- **Informations** : Pseudo, email, date d'inscription
- **Actions** : Déconnexion, modification profil

### `[duel_duels]` - Interface de Gestion des Duels

Interface complète de gestion des duels avec onglets et fonctionnalités avancées.

**Attributs :**
- `default_tab` : Onglet par défaut ("mes-duels", "proposer", "historique")
- `show_stats` : Afficher statistiques rapides (défaut: "true")

**Exemples :**
```php
[duel_duels]
[duel_duels default_tab="proposer"]
[duel_duels show_stats="false"]
```

**Fonctionnalités incluses :**

**Onglet "Mes Duels" :**
- Liste des duels en cours et en attente
- Actions : Accepter, refuser, valider score
- Filtres par statut et adversaire
- Notifications visuelles

**Onglet "Proposer un Duel" :**
- Sélection d'adversaire dans la liste des duellistes
- Configuration du duel (type, règles)
- Envoi de proposition avec notification
- Validation avant envoi

**Onglet "Historique" :**
- Historique complet des duels terminés
- Filtres par date, adversaire, résultat
- Statistiques détaillées par période
- Export des données (à venir)

### `[duel_classement]` - Classement des Duellistes

Affiche le classement général ou junior avec pagination et filtres.

**Attributs :**
- `type` : Type de classement ("general" ou "junior")
- `max` : Nombre d'entrées à afficher (1-100, défaut: 10)
- `titre` : Titre personnalisé du classement

**Exemples :**
```php
[duel_classement]
[duel_classement type="junior" max="15"]
[duel_classement type="general" max="20" titre="Top Escrimeurs"]
```

**Données affichées :**
- **Rang** : Position dans le classement
- **Duelliste** : Avatar + pseudo
- **Points ELO** : Score de classement
- **Statistiques** : V/D/Ratio sur la période
- **Évolution** : Tendance (montée/descente)

### `[duel_home]` - Widget d'Accueil

Widget d'accueil avec présentation et statistiques globales.

**Attributs :**
- `show_stats` : Afficher stats globales (défaut: "true")
- `show_top_players` : Afficher top joueurs (défaut: "true")
- `max_top_players` : Nombre de top joueurs (défaut: 5)

**Exemples :**
```php
[duel_home]
[duel_home show_top_players="false"]
[duel_home max_top_players="3"]
```

## 🏗️ Architecture Technique

### 📁 Structure du Plugin

```
WP_DuelByBenribsLab/
├── duel-plugin.php              # Fichier principal du plugin
├── README.md                    # Documentation complète
├── assets/                      # Assets front-end
│   ├── style.css               # Styles CSS du plugin
│   └── script.js               # JavaScript et AJAX
├── includes/                    # Classes PHP du plugin
│   ├── class-api-client.php    # Client API pour WordPress
│   ├── class-auth.php          # Gestion authentification
│   └── shortcodes/             # Implémentation des shortcodes
│       ├── login.php           # Shortcode [duel_login]
│       ├── register.php        # Shortcode [duel_register]
│       ├── profile.php         # Shortcode [duel_profile]
│       ├── duels.php           # Shortcode [duel_duels]
│       ├── classement.php      # Shortcode [duel_classement]
│       └── home.php            # Shortcode [duel_home]
└── templates/                   # Templates HTML (optionnel)
```

### 🔧 Classes PHP Principales

**Classe `DuelByBenribsLab`** (Singleton principal) :
```php
// duel-plugin.php
class DuelByBenribsLab {
    // Gestion des hooks WordPress
    // Enregistrement des shortcodes
    // Chargement des assets
    // Configuration du plugin
}
```

**Classe `Duel_API_Client`** (Communication API) :
```php
// includes/class-api-client.php
class Duel_API_Client {
    public function make_request($endpoint, $data, $method, $token);
    public function login($identifier, $password_or_otp);
    public function register($data);
    public function get_current_user($token);
    public function get_my_duels($user_id, $token);
    public function get_classement($type, $limit);
    // ... autres méthodes API
}
```

**Classe `Duel_Auth`** (Authentification) :
```php
// includes/class-auth.php
class Duel_Auth {
    public function is_logged_in();
    public function get_user_data();
    public function login_user($token, $user_data);
    public function logout_user();
    public function get_current_user_profile();
}
```

### 🎨 Système de Styles CSS

**Classes CSS principales :**
```css
/* Conteneurs généraux */
.duel-container { /* Container principal */ }
.duel-form-container { /* Conteneur de formulaire */ }
.duel-profile-container { /* Conteneur de profil */ }

/* États et messages */
.duel-success { /* Messages de succès */ }
.duel-error { /* Messages d'erreur */ }
.duel-loading { /* Indicateurs de chargement */ }

/* Composants spécifiques */
.duel-tabs { /* Système d'onglets */ }
.duel-avatar { /* Avatars utilisateurs */ }
.duel-stats { /* Blocs de statistiques */ }
.duel-classement { /* Tables de classement */ }

/* Responsive design */
@media (max-width: 768px) { /* Styles mobiles */ }
```

### ⚡ Interactions JavaScript

**Fonctionnalités AJAX :**
```javascript
// assets/script.js

// Gestion des formulaires
duelPlugin.handleFormSubmission();

// Mise à jour en temps réel
duelPlugin.refreshData();

// Gestion des onglets
duelPlugin.initTabs();

// Upload d'avatars
duelPlugin.handleAvatarUpload();

// Notifications automatiques
duelPlugin.showNotification(type, message);
```

## 🔐 Sécurité et Sessions

### 🛡️ Authentification Sécurisée

**Stockage des tokens :**
```php
// Stockage sécurisé en session PHP (pas localStorage)
$_SESSION['duel_token'] = $jwt_token;
$_SESSION['duel_user'] = $user_data;

// Vérification automatique sur chaque requête
if (!isset($_SESSION['duel_token'])) {
    // Redirection vers login
}
```

**Validation des requêtes :**
```php
// Chaque shortcode vérifie l'authentification
if (!$auth->is_logged_in()) {
    return self::render_not_logged_in();
}

// Validation des tokens à chaque appel API
$response = $api_client->make_request($endpoint, $data, 'GET', $token);
if ($response['status'] === 401) {
    $auth->logout_user(); // Déconnexion automatique
}
```

### 🔒 Protection contre les Attaques

**Nonces WordPress :**
```php
// Protection CSRF sur les formulaires
wp_nonce_field('duel_action', 'duel_nonce');

// Vérification côté serveur
if (!wp_verify_nonce($_POST['duel_nonce'], 'duel_action')) {
    wp_die('Sécurité : Requête non autorisée');
}
```

**Validation des données :**
```php
// Sanitisation des entrées utilisateur
$pseudo = sanitize_text_field($_POST['pseudo']);
$email = sanitize_email($_POST['email']);

// Validation côté serveur
if (!is_email($email)) {
    return array('error' => 'Email invalide');
}
```

## 🎯 Utilisation Pratique

### 📝 Exemples d'Intégration

**Page de connexion complète :**
```html
<!-- Page WordPress dédiée -->
<div class="page-duel-connexion">
    <h1>Connexion Escrimeurs</h1>
    [duel_login title="Accès Réservé" redirect_after_login="/dashboard-escrime/"]
    
    <div class="separation">
        <p>Pas encore inscrit ?</p>
    </div>
    
    [duel_register title="Rejoindre la Communauté" default_auth_mode="email"]
</div>
```

**Dashboard utilisateur :**
```html
<!-- Page tableau de bord -->
<div class="dashboard-escrimeur">
    <div class="row">
        <div class="col-md-4">
            [duel_profile title="Mon Profil Escrimeur"]
        </div>
        <div class="col-md-8">
            [duel_duels default_tab="mes-duels"]
        </div>
    </div>
    
    <div class="row mt-4">
        <div class="col-12">
            <h3>Classement Actuel</h3>
            [duel_classement type="general" max="15"]
        </div>
    </div>
</div>
```

**Page d'accueil avec widgets :**
```html
<!-- Intégration sur la home -->
<section class="section-duel-home">
    [duel_home show_stats="true" max_top_players="5"]
</section>

<section class="section-classement-apercu">
    <h2>Top Escrimeurs</h2>
    [duel_classement type="general" max="10"]
</section>
```

### 🎨 Personnalisation CSS

**Intégration avec votre thème :**
```css
/* Dans le fichier CSS de votre thème */

/* Adapter les couleurs à votre charte */
.duel-container {
    --duel-primary: #your-primary-color;
    --duel-secondary: #your-secondary-color;
    --duel-success: #your-success-color;
    --duel-danger: #your-danger-color;
}

/* Personnaliser les boutons */
.duel-btn {
    border-radius: 0; /* Boutons carrés */
    text-transform: uppercase;
    font-weight: bold;
}

/* Adapter la typography */
.duel-container h1,
.duel-container h2,
.duel-container h3 {
    font-family: 'Votre-Font', sans-serif;
}
```

## 🐛 Debugging et Logs

### 🔍 Diagnostic des Problèmes

**Vérification de l'API :**
```php
// Test de connexion API
$api_client = new Duel_API_Client();
$test = $api_client->make_request('test', array(), 'GET');
var_dump($test); // Voir la réponse
```

**Debug des sessions :**
```php
// Vérifier l'état des sessions
session_start();
echo '<pre>';
print_r($_SESSION);
echo '</pre>';
```

**Logs WordPress :**
```php
// Activer les logs dans wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);

// Écrire des logs personnalisés
error_log('Duel Plugin: ' . $message);
```

### 🚨 Erreurs Courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| "Plugin non initialisé" | Classes non chargées | Vérifier activation du plugin |
| "API non accessible" | URL API incorrecte | Vérifier configuration URL |
| "Token expiré" | Session expirée | Forcer reconnexion utilisateur |
| "Shortcode ne s'affiche pas" | Conflit de thème | Vérifier compatibilité CSS |

## 🚀 Optimisation et Performance

### ⚡ Cache et Performance

**Cache des requêtes API :**
```php
// Cache WordPress transients
$cache_key = 'duel_classement_' . $type;
$classement = get_transient($cache_key);

if ($classement === false) {
    $classement = $api_client->get_classement($type);
    set_transient($cache_key, $classement, 300); // 5 minutes
}
```

**Optimisation des assets :**
```php
// Chargement conditionnel des scripts
if (has_shortcode($post->post_content, 'duel_duels')) {
    wp_enqueue_script('duel-duels-js');
}
```

### 🎯 Bonnes Pratiques

**Chargement des ressources :**
- ✅ Scripts chargés uniquement sur les pages avec shortcodes
- ✅ CSS minifié et optimisé
- ✅ Images d'avatar redimensionnées automatiquement
- ✅ Cache API pour éviter les requêtes répétées

**Compatibilité :**
- ✅ Compatible avec la plupart des thèmes WordPress
- ✅ Respecte les standards WordPress (hooks, filtres)
- ✅ Code sécurisé selon les bonnes pratiques WP
- ✅ Responsive design adaptatif

## 📚 API et Endpoints

### 🔗 Endpoints Utilisés

Le plugin utilise les endpoints suivants de l'API Duel :

| Endpoint | Méthode | Utilisation |
|----------|---------|-------------|
| `/auth/login` | POST | Connexion utilisateur |
| `/auth/register` | POST | Inscription utilisateur |
| `/auth/send-otp` | POST | Envoi code OTP |
| `/auth/verify-otp` | POST | Vérification OTP |
| `/auth/me` | GET | Profil utilisateur actuel |
| `/duellistes` | GET | Liste des duellistes |
| `/duels` | GET/POST | Gestion des duels |
| `/classement` | GET | Classements général/junior |
| `/upload/avatar` | POST | Upload avatar |

### 🔄 Gestion des Erreurs API

```php
// Gestion centralisée des erreurs
class Duel_API_Client {
    private function handle_api_error($response) {
        if (isset($response['error'])) {
            switch ($response['status']) {
                case 401:
                    return 'Token expiré. Veuillez vous reconnecter.';
                case 403:
                    return 'Accès interdit.';
                case 500:
                    return 'Erreur serveur. Veuillez réessayer.';
                default:
                    return $response['error'];
            }
        }
        return null;
    }
}
```

## 🔮 Roadmap et Évolutions

### ✅ Fonctionnalités Actuelles
- Authentification complète (OTP + password)
- Gestion des duels avec interface complète
- Profils utilisateurs avec statistiques
- Classements général et junior
- Design responsive et accessible
- Sessions sécurisées PHP

### 🔄 En Développement
- Cache API plus avancé
- Notifications en temps réel
- Interface d'administration WordPress
- Templates personnalisables
- Export de données

### 📋 Prochaines Versions
- Mode offline basique
- Synchronisation bidirectionnelle
- Hooks et filtres pour développeurs
- Widget WordPress natif
- Support multilingue (i18n)

## 📝 Licence et Support

**Licence :** MIT - Benribs Lab © 2025

**Support technique :**
- Documentation : Ce README
- Issues : Via le repository GitHub
- Contact : https://duel.benribs.fr

**Compatibilité :**
- WordPress : 5.0+
- PHP : 7.4+
- API Duel : v1.0+

---

**🗂️ Plugin WordPress développé avec passion pour intégrer l'univers de l'escrime dans vos sites web !**

**Attributs :**
- `title` : Titre du formulaire (défaut: "Inscription")
- `show_login_link` : Afficher le lien de connexion (défaut: "true")
- `redirect_after_register` : URL de redirection après inscription

**Exemples :**
```php
[duel_register]
[duel_register title="Rejoindre le club"]
```

**Fonctionnement :**
1. Saisie du pseudo souhaité
2. Question : "Avez-vous accès à vos emails à la salle ?"
3. Si OUI → Saisie email + vérification OTP
4. Si NON → Création mot de passe

### `[duel_profile]` - Profil utilisateur

Affiche le profil complet de l'utilisateur connecté.

**Attributs :**
- `title` : Titre du profil (défaut: "Mon Profil")
- `show_avatar` : Afficher l'avatar (défaut: "true")
- `show_stats` : Afficher les statistiques V/D (défaut: "true")
- `show_rank` : Afficher le rang et performances (défaut: "true")
- `show_logout` : Afficher le bouton déconnexion (défaut: "true")

**Exemples :**
```php
[duel_profile]
[duel_profile title="Mon espace" show_logout="false"]
[duel_profile show_avatar="false" show_rank="false"]
```

**Contenu affiché :**
- Avatar (image ou initiales)
- Pseudo et catégorie
- Statistiques : Victoires, Défaites, Matchs totaux
- Ratio de victoires et indice touches
- Date d'inscription
- Bouton de déconnexion

## 🎨 Personnalisation CSS

Le plugin inclut des styles CSS modernes et responsives. Vous pouvez les personnaliser en ajoutant du CSS dans votre thème :

```css
/* Personnaliser les couleurs du plugin */
.duel-btn-primary {
    background: #votre-couleur !important;
}

.duel-login-container {
    max-width: 500px; /* Largeur personnalisée */
}
```

**Classes CSS principales :**
- `.duel-login-container` - Container principal de connexion
- `.duel-register-container` - Container principal d'inscription  
- `.duel-profile-container` - Container principal du profil
- `.duel-btn-primary` - Boutons principaux
- `.duel-btn-secondary` - Boutons secondaires
- `.duel-error` - Messages d'erreur
- `.duel-success` - Messages de succès

## ⚙️ Configuration

### URL de l'API

Par défaut, le plugin utilise `https://duel.benribs.fr/api`. Vous pouvez modifier cette URL :

1. Dans l'admin WordPress : **Réglages > Général**
2. Ou en ajoutant dans `wp-config.php` :
```php
define('DUEL_API_BASE_URL', 'https://votre-api.exemple.com/api');
```

### Sessions

Le plugin utilise les sessions PHP natives pour stocker les tokens d'authentification. Les sessions expirent automatiquement après 7 jours.

## 🔒 Sécurité

- **Tokens JWT** : Stockage sécurisé des tokens d'authentification
- **Nonces WordPress** : Protection CSRF sur tous les formulaires
- **Validation** : Sanitisation de toutes les données utilisateur
- **Sessions** : Nettoyage automatique des sessions expirées

## 🐛 Dépannage

### Le plugin ne fonctionne pas
1. Vérifiez que l'API est accessible depuis votre serveur
2. Testez l'URL : `https://duel.benribs.fr/api/classement`
3. Vérifiez les logs d'erreur WordPress

### Problème de connexion
1. Videz le cache WordPress si activé
2. Vérifiez que les sessions PHP sont activées
3. Testez en navigation privée

### Styles cassés
1. Vérifiez que le fichier CSS se charge : `/wp-content/plugins/WP_DuelByBenribsLab/assets/style.css`
2. Videz le cache du navigateur
3. Vérifiez les conflits avec d'autres plugins

## 📝 Notes techniques

- **API utilisée** : REST API Duel by Benribs Lab
- **Authentification** : JWT via sessions PHP
- **Compatibilité** : WordPress 5.0+ et PHP 7.4+
- **Dépendances** : Aucune dépendance externe

## 🆕 Évolutions futures

- Shortcode de classement `[duel_classement]`
- Shortcode d'invitation `[duel_invitation]`
- Shortcode de saisie résultats `[duel_results]`
- Page d'administration dédiée
- Cache des données API

## 📞 Support

Pour toute question ou problème :
- **API** : Contactez l'équipe Benribs Lab
- **Plugin** : Vérifiez la documentation ou les logs WordPress

---

**Développé par Benribs Lab** - Version 1.0.0