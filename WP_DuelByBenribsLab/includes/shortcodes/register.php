<?php
/**
 * Shortcode d'inscription [duel_register]
 */

if (!defined('ABSPATH')) {
    exit;
}

class Duel_Register_Shortcode {
    
    /**
     * Rendre le shortcode d'inscription
     * 
     * @param array $atts Attributs du shortcode
     * @return string HTML du formulaire d'inscription
     */
    public static function render($atts = array()) {
        // Démarrer la session si ce n'est pas déjà fait
        if (session_status() == PHP_SESSION_NONE) {
            session_start();
        }
        
        // Attributs par défaut
        $atts = shortcode_atts(array(
            'redirect_after_register' => '',
            'show_login_link' => 'true',
            'title' => 'Inscription'
        ), $atts);
        
        // Initialiser l'authentification
        $auth = new Duel_Auth();
        
        // Si déjà connecté, rediriger ou afficher un message
        if ($auth->is_logged_in()) {
            return '<div class="duel-register-container"><div class="duel-success">✅ Vous êtes connecté avec succès !</div></div>';
        }
        
        // Vérifier si on vient d'une inscription réussie
        if (isset($_GET['registered']) && $_GET['registered'] == '1') {
            return '<div class="duel-register-container"><div class="duel-success">✅ Inscription et connexion réussies ! Vous pouvez maintenant utiliser votre compte.</div></div>';
        }
        
        // Traitement des formulaires
        $form_data = self::handle_form_submission($auth);
        
        // Générer le HTML
        ob_start();
        ?>
        <div class="duel-register-container">
            <?php if (isset($form_data['error'])): ?>
                <div class="duel-error">
                    <?php echo esc_html($form_data['error']); ?>
                </div>
            <?php endif; ?>
            
            <?php if (isset($form_data['success_message'])): ?>
                <div class="duel-success">
                    <?php echo esc_html($form_data['success_message']); ?>
                    <?php if ($atts['show_login_link'] === 'true'): ?>
                        <p><a href="https://escrime-cey.fr/connexion-duel-by-benribs-lab/" class="duel-login-link">Se connecter maintenant</a></p>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
            
            <?php if (isset($form_data['step']) && $form_data['step'] === 'otp'): ?>
                <?php echo self::render_otp_verification_form($form_data['email'], $atts); ?>
            <?php elseif (isset($form_data['step']) && $form_data['step'] === 'password_form'): ?>
                <?php echo self::render_password_registration_form($form_data['pseudo'], $atts); ?>
            <?php elseif (isset($form_data['step']) && $form_data['step'] === 'otp_form'): ?>
                <?php echo self::render_otp_registration_form($form_data['pseudo'], $atts); ?>
            <?php else: ?>
                <?php echo self::render_email_question_form($atts); ?>
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
        });
        </script>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Traiter les soumissions de formulaire
     */
    private static function handle_form_submission($auth) {
        if (!isset($_POST['duel_action'])) {
            return array();
        }
        
        // Vérifier le nonce de sécurité
        if (!wp_verify_nonce($_POST['duel_nonce'], 'duel_register_nonce')) {
            return array('error' => 'Erreur de sécurité');
        }
        
        switch ($_POST['duel_action']) {
            case 'back_to_start':
                // Redirection vers la page actuelle pour retour au début
                wp_redirect($_SERVER['REQUEST_URI']);
                exit;
                
            case 'email_access_yes':
                // L'utilisateur a accès aux emails → formulaire OTP
                $pseudo = sanitize_text_field($_POST['pseudo']);
                if (empty($pseudo)) {
                    return array('error' => 'Veuillez entrer un pseudo');
                }
                return array(
                    'step' => 'otp_form',
                    'pseudo' => $pseudo
                );
                
            case 'email_access_no':
                // L'utilisateur n'a pas accès aux emails → formulaire mot de passe
                $pseudo = sanitize_text_field($_POST['pseudo']);
                if (empty($pseudo)) {
                    return array('error' => 'Veuillez entrer un pseudo');
                }
                return array(
                    'step' => 'password_form',
                    'pseudo' => $pseudo
                );
                
            case 'register_with_otp':
                $pseudo = sanitize_text_field($_POST['pseudo']);
                $email = sanitize_email($_POST['email']);
                
                if (empty($pseudo) || empty($email)) {
                    return array('error' => 'Pseudo et email requis');
                }
                
                $result = $auth->register_with_otp($pseudo, $email);
                
                if ($result['success'] && isset($result['step']) && $result['step'] === 'otp') {
                    return array(
                        'step' => 'otp',
                        'email' => $email,
                        'message' => $result['message']
                    );
                }
                
                return $result;
                
            case 'register_with_password':
                $pseudo = sanitize_text_field($_POST['pseudo']);
                $password = $_POST['password']; // Ne pas sanitizer le mot de passe
                $confirm_password = $_POST['confirm_password'];
                
                if (empty($pseudo) || empty($password) || empty($confirm_password)) {
                    return array('error' => 'Tous les champs sont requis');
                }
                
                if ($password !== $confirm_password) {
                    return array('error' => 'Les mots de passe ne correspondent pas');
                }
                
                if (strlen($password) < 6) {
                    return array('error' => 'Le mot de passe doit contenir au moins 6 caractères');
                }
                
                $result = $auth->register_with_password($pseudo, $password);
                
                // Si l'inscription est réussie, rediriger
                if (isset($result['success']) && $result['success']) {
                    wp_redirect(add_query_arg('registered', '1', $_SERVER['REQUEST_URI']));
                    exit;
                }
                
                return $result;
                
            case 'verify_register_otp':
                $email = sanitize_email($_POST['email']);
                $otp_code = sanitize_text_field($_POST['otp_code']);
                
                if (empty($email) || empty($otp_code)) {
                    return array('error' => 'Email et code OTP requis');
                }
                
                $result = $auth->verify_otp($email, $otp_code);
                
                // Si la connexion est réussie, on doit rediriger pour éviter les problèmes de nonce
                if (isset($result['success']) && $result['success']) {
                    // Nettoyer les données POST pour éviter la resoumission
                    wp_redirect(add_query_arg('registered', '1', $_SERVER['REQUEST_URI']));
                    exit;
                }
                
                return $result;
        }
        
        return array();
    }
    
    /**
     * Formulaire de question sur l'accès email (étape 1)
     */
    private static function render_email_question_form($atts) {
        ob_start();
        ?>
        <div class="duel-register-form">
            <h3><?php echo esc_html($atts['title']); ?></h3>
            
            <form method="post" action="" id="duel-register-step1">
                <?php wp_nonce_field('duel_register_nonce', 'duel_nonce'); ?>
                
                <div class="duel-form-group">
                    <label for="pseudo">Votre pseudo</label>
                    <input type="text" id="pseudo" name="pseudo" required 
                           placeholder="Votre pseudo d'escrimeur"
                           class="duel-form-control"
                           value="<?php echo isset($_POST['pseudo']) ? esc_attr($_POST['pseudo']) : ''; ?>">
                    <small class="duel-form-help">Ce sera votre identifiant pour les duels</small>
                </div>
                
                <div class="duel-register-question">
                    <h4>Avez-vous accès à vos emails à la salle d'escrime ?</h4>
                    <p class="duel-form-description">Cette information nous aide à choisir le meilleur mode d'authentification pour vous.</p>
                    
                    <input type="hidden" name="duel_action" id="duel_action" value="">
                    
                    <div class="duel-question-buttons">
                        <button type="button" onclick="submitWithAction('email_access_yes')" 
                                class="duel-btn duel-btn-primary">
                            ✉️ Oui, j'ai accès
                        </button>
                        <button type="button" onclick="submitWithAction('email_access_no')" 
                                class="duel-btn duel-btn-secondary">
                            🔒 Non, pas d'accès
                        </button>
                    </div>
                    
                    <script>
                    function submitWithAction(action) {
                        const pseudoInput = document.getElementById('pseudo');
                        if (!pseudoInput.value.trim()) {
                            alert('Veuillez d\'abord saisir votre pseudo');
                            pseudoInput.focus();
                            return false;
                        }
                        
                        document.getElementById('duel_action').value = action;
                        document.getElementById('duel-register-step1').submit();
                    }
                    </script>
                </div>
            </form>
            
            <?php if ($atts['show_login_link'] === 'true'): ?>
                <p class="duel-login-link-container">
                    Déjà un compte ? 
                    <a href="https://escrime-cey.fr/connexion-duel-by-benribs-lab/" class="duel-login-link">Se connecter</a>
                </p>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Formulaire d'inscription avec OTP (étape 2a)
     */
    private static function render_otp_registration_form($pseudo, $atts) {
        ob_start();
        ?>
        <div class="duel-register-form">
            <h3>Inscription avec email</h3>
            <p class="duel-form-description">
                Parfait ! Vous allez recevoir un code de vérification par email.
            </p>
            
            <form method="post" action="">
                <?php wp_nonce_field('duel_register_nonce', 'duel_nonce'); ?>
                <input type="hidden" name="duel_action" value="register_with_otp">
                <input type="hidden" name="pseudo" value="<?php echo esc_attr($pseudo); ?>">
                
                <div class="duel-form-group">
                    <label for="pseudo_display">Pseudo</label>
                    <input type="text" id="pseudo_display" value="<?php echo esc_attr($pseudo); ?>" 
                           disabled class="duel-form-control">
                </div>
                
                <div class="duel-form-group">
                    <label for="email">Votre email</label>
                    <input type="email" id="email" name="email" required 
                           placeholder="votre.email@exemple.com"
                           class="duel-form-control">
                    <small class="duel-form-help">Un code de vérification sera envoyé à cette adresse</small>
                </div>
                
                <div class="duel-form-actions">
                    <button type="button" class="duel-btn duel-btn-secondary duel-back-button">
                        ← Retour
                    </button>
                    <button type="submit" class="duel-btn duel-btn-primary">
                        Recevoir le code
                    </button>
                </div>
            </form>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Formulaire d'inscription avec mot de passe (étape 2b)
     */
    private static function render_password_registration_form($pseudo, $atts) {
        ob_start();
        ?>
        <div class="duel-register-form">
            <h3>Inscription avec mot de passe</h3>
            <p class="duel-form-description">
                Pas de problème ! Créez un mot de passe pour sécuriser votre compte.
            </p>
            
            <form method="post" action="">
                <?php wp_nonce_field('duel_register_nonce', 'duel_nonce'); ?>
                <input type="hidden" name="duel_action" value="register_with_password">
                <input type="hidden" name="pseudo" value="<?php echo esc_attr($pseudo); ?>">
                
                <div class="duel-form-group">
                    <label for="pseudo_display">Pseudo</label>
                    <input type="text" id="pseudo_display" value="<?php echo esc_attr($pseudo); ?>" 
                           disabled class="duel-form-control">
                </div>
                
                <div class="duel-form-group">
                    <label for="password">Mot de passe</label>
                    <input type="password" id="password" name="password" required 
                           minlength="6" class="duel-form-control">
                    <small class="duel-form-help">Au moins 6 caractères</small>
                </div>
                
                <div class="duel-form-group">
                    <label for="confirm_password">Confirmer le mot de passe</label>
                    <input type="password" id="confirm_password" name="confirm_password" required 
                           minlength="6" class="duel-form-control">
                </div>
                
                <div class="duel-form-actions">
                    <button type="button" class="duel-btn duel-btn-secondary duel-back-button">
                        ← Retour
                    </button>
                    <button type="submit" class="duel-btn duel-btn-primary">
                        Créer le compte
                    </button>
                </div>
            </form>
        </div>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Formulaire de vérification OTP pour inscription (étape 3)
     */
    private static function render_otp_verification_form($email, $atts) {
        ob_start();
        ?>
        <div class="duel-register-form">
            <h3>Vérification email</h3>
            <p class="duel-form-description">
                Un code à 6 chiffres a été envoyé à <strong><?php echo esc_html($email); ?></strong>
            </p>
            
            <form method="post" action="">
                <?php wp_nonce_field('duel_register_nonce', 'duel_nonce'); ?>
                <input type="hidden" name="duel_action" value="verify_register_otp">
                <input type="hidden" name="email" value="<?php echo esc_attr($email); ?>">
                
                <div class="duel-form-group">
                    <label for="otp_code">Code de vérification</label>
                    <input type="text" id="otp_code" name="otp_code" required 
                           pattern="[0-9]{6}" maxlength="6"
                           placeholder="123456"
                           class="duel-form-control duel-otp-input">
                    <small class="duel-form-help">Saisissez le code reçu par email</small>
                </div>
                
                <div class="duel-form-actions">
                    <button type="button" class="duel-btn duel-btn-secondary duel-back-button">
                        ← Retour
                    </button>
                    <button type="submit" class="duel-btn duel-btn-primary">
                        Finaliser l'inscription
                    </button>
                </div>
            </form>
        </div>
        <?php
        return ob_get_clean();
    }
}