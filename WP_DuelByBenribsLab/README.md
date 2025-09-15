# Plugin WordPress - Duel by Benribs Lab

Plugin WordPress pour intégrer les fonctionnalités de duels d'escrime via l'API Duel by Benribs Lab.

## 🎯 Description

Ce plugin permet d'afficher des briques fonctionnelles de l'application Duel by Benribs Lab directement sur un site WordPress via des shortcodes. Les utilisateurs peuvent se connecter, s'inscrire et consulter leur profil sans quitter le site WordPress.

## 📋 Fonctionnalités

- **Connexion intelligente** : Détection automatique email/pseudo avec gestion OTP
- **Inscription adaptative** : Choix entre authentification par email (OTP) ou mot de passe
- **Profil utilisateur** : Affichage des statistiques, avatar et informations
- **Intégration transparente** : Utilise l'API existante sans modification
- **Design responsive** : S'adapte à tous les écrans et thèmes WordPress

## 🚀 Installation

1. **Télécharger** le dossier `WP_DuelByBenribsLab`
2. **Placer** le dossier dans `/wp-content/plugins/`
3. **Activer** le plugin dans l'administration WordPress
4. **Configurer** l'URL de l'API si nécessaire (par défaut : `https://duel.benribs.fr/api`)

## 🛠️ Shortcodes disponibles

### `[duel_login]` - Formulaire de connexion

Affiche un formulaire de connexion intelligent qui s'adapte au type d'utilisateur.

**Attributs :**
- `title` : Titre du formulaire (défaut: "Connexion")
- `show_register_link` : Afficher le lien d'inscription (défaut: "true")
- `redirect_after_login` : URL de redirection après connexion

**Exemples :**
```php
[duel_login]
[duel_login title="Se connecter" show_register_link="false"]
```

**Fonctionnement :**
1. L'utilisateur saisit son email ou pseudo
2. Si email → Code OTP envoyé automatiquement
3. Si pseudo → Demande du mot de passe
4. Connexion automatique et stockage sécurisé du token

### `[duel_register]` - Formulaire d'inscription

Affiche un formulaire d'inscription avec choix du mode d'authentification.

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