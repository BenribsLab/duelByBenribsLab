<?php
/**
 * Shortcode de connexion [duel_login]
 */

if (!defined('ABSPATH')) {
    exit;
}

class Duel_Login_Shortcode {
    
    /**
     * Rendre le shortcode de connexion
     * 
     * @param array $atts Attributs du shortcode
     * @return string HTML du formulaire de connexion
     */
    public static function render($atts = array()) {
        // Attributs par défaut
        $atts = shortcode_atts(array(
            'redirect_after_login' => '',
            'show_register_link' => 'true',
            'title' => 'Connexion'
        ), $atts);
        
        // Initialiser l'authentification
        $auth = new Duel_Auth();
        
        // Les actions sont maintenant traitées dans duel-plugin.php avant l'affichage
        // Récupérer les données de session pour l'affichage
        $form_data = self::get_form_display_data($auth);
        
        // Si déjà connecté, afficher un message
        if ($auth->is_logged_in()) {
            $user = $auth->get_user_data();
            return self::render_already_logged_in($user);
        }
        
        // Générer le HTML
        ob_start();
        ?>
        <div class="duel-login-container">
            <?php if (isset($form_data['error'])): ?>
                <div class="duel-error">
                    <?php echo esc_html($form_data['error']); ?>
                    <?php if (isset($form_data['suggest_register']) && $form_data['suggest_register'] && $atts['show_register_link'] === 'true'): ?>
                        <p><a href="https://escrime-cey.fr/inscription-duel-by-benribs-lab/">Créer un compte</a></p>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
            
            <?php if (isset($form_data['success_message'])): ?>
                <div class="duel-success">
                    <?php echo esc_html($form_data['success_message']); ?>
                </div>
            <?php endif; ?>
            
            <?php if (isset($form_data['step']) && $form_data['step'] === 'password'): ?>
                <?php echo self::render_password_form($form_data['identifier'], $atts); ?>
            <?php elseif (isset($form_data['step']) && $form_data['step'] === 'otp'): ?>
                <?php echo self::render_otp_form($form_data['identifier'], $atts); ?>
            <?php else: ?>
                <?php echo self::render_identifier_form($atts); ?>
            <?php endif; ?>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            // Gestion du retour en arrière - utiliser redirection PHP au lieu de reload JS
            $('.duel-back-button').on('click', function(e) {
                e.preventDefault();
                // Soumettre un formulaire pour déclencher redirection PHP
                var form = $('<form method="post"><input type="hidden" name="duel_action" value="back_to_start"></form>');
                $('body').append(form);
                form.submit();
            });
            
            // Gestion spécifique des liens d'inscription pour contourner l'interception
            $('.duel-register-link').on('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // Navigation directe
                window.location.href = $(this).attr('href');
                return false;
            });
        });
        </script>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Récupérer les données pour l'affichage du formulaire
     */
    private static function get_form_display_data($auth) {
        // Retourner les données stockées en session ou vides
        return isset($_SESSION['duel_login_step']) ? $_SESSION['duel_login_step'] : array();
    }
    
    /**
     * Formulaire de saisie d'identifiant (étape 1)
     */
    private static function render_identifier_form($atts) {
        ob_start();
        ?>
        <div class="duel-login-form">
            <h3><?php echo esc_html($atts['title']); ?></h3>
            <p class="duel-form-description">Entrez votre email ou pseudo pour continuer</p>
            
            <form method="post" action="">
                <?php wp_nonce_field('duel_login_nonce', 'duel_nonce'); ?>
                <input type="hidden" name="duel_action" value="login_step1">
                
                <div class="duel-form-group">
                    <label for="identifier">Email ou Pseudo</label>
                    <input type="text" id="identifier" name="identifier" required 
                           placeholder="votre.email@exemple.com ou votre_pseudo"
                           class="duel-form-control">
                </div>
                
                <button type="submit" class="duel-btn duel-btn-primary">
                    Continuer
                </button>
            </form>
            
            <?php if ($atts['show_register_link'] === 'true'): ?>
                <p class="duel-register-link-container">
                    Pas encore de compte ? 
                    <a href="https://escrime-cey.fr/inscription-duel-by-benribs-lab/" class="duel-register-link">Créer un compte</a>
                </p>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Formulaire de saisie de mot de passe (étape 2 pour pseudos)
     */
    private static function render_password_form($pseudo, $atts) {
        ob_start();
        ?>
        <div class="duel-login-form">
            <h3>Mot de passe</h3>
            <p class="duel-form-description">Entrez votre mot de passe pour <strong><?php echo esc_html($pseudo); ?></strong></p>
            
            <form method="post" action="">
                <?php wp_nonce_field('duel_login_nonce', 'duel_nonce'); ?>
                <input type="hidden" name="duel_action" value="login_password">
                <input type="hidden" name="pseudo" value="<?php echo esc_attr($pseudo); ?>">
                
                <div class="duel-form-group">
                    <label for="password">Mot de passe</label>
                    <input type="password" id="password" name="password" required 
                           class="duel-form-control">
                </div>
                
                <div class="duel-form-actions">
                    <button type="button" class="duel-btn duel-btn-secondary duel-back-button">
                        ← Retour
                    </button>
                    <button type="submit" class="duel-btn duel-btn-primary">
                        Se connecter
                    </button>
                </div>
            </form>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Formulaire de saisie de code OTP (étape 2 pour emails)
     */
    private static function render_otp_form($email, $atts) {
        ob_start();
        ?>
        <div class="duel-login-form">
            <h3>Code de vérification</h3>
            <p class="duel-form-description">Un code à 6 chiffres a été envoyé à <strong><?php echo esc_html($email); ?></strong></p>
            
            <form method="post" action="">
                <?php wp_nonce_field('duel_login_nonce', 'duel_nonce'); ?>
                <input type="hidden" name="duel_action" value="verify_otp">
                <input type="hidden" name="email" value="<?php echo esc_attr($email); ?>">
                
                <div class="duel-form-group">
                    <label for="otp_code">Code OTP (6 chiffres)</label>
                    <input type="text" id="otp_code" name="otp_code" required 
                           pattern="[0-9]{6}" maxlength="6"
                           placeholder="123456"
                           class="duel-form-control duel-otp-input">
                </div>
                
                <div class="duel-form-actions">
                    <button type="button" class="duel-btn duel-btn-secondary duel-back-button">
                        ← Retour
                    </button>
                    <button type="submit" class="duel-btn duel-btn-primary">
                        Valider
                    </button>
                </div>
            </form>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Message pour utilisateur déjà connecté
     */
    private static function render_already_logged_in($user) {
        ob_start();
        ?>
        <div class="duel-login-container">
            <div class="duel-already-logged-in">
                <p>Vous êtes déjà connecté en tant que <strong><?php echo esc_html($user['pseudo']); ?></strong></p>
                <form method="post" action="">
                    <?php wp_nonce_field('duel_logout_nonce', 'duel_nonce'); ?>
                    <input type="hidden" name="duel_action" value="logout">
                    <button type="submit" class="duel-btn duel-btn-secondary">
                        Se déconnecter
                    </button>
                </form>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}

// Gérer la déconnexion
add_action('init', function() {
    if (isset($_POST['duel_action']) && $_POST['duel_action'] === 'logout') {
        if (wp_verify_nonce($_POST['duel_nonce'], 'duel_logout_nonce')) {
            $auth = new Duel_Auth();
            $auth->logout();
            wp_redirect($_SERVER['REQUEST_URI']);
            exit;
        }
    }
});