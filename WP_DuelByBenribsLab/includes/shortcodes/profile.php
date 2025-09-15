<?php
/**
 * Shortcode de profil [duel_profile]
 */

if (!defined('ABSPATH')) {
    exit;
}

class Duel_Profile_Shortcode {
    
    /**
     * Rendre le shortcode de profil
     * 
     * @param array $atts Attributs du shortcode
     * @return string HTML du profil utilisateur
     */
    public static function render($atts = array()) {
        // Attributs par défaut
        $atts = shortcode_atts(array(
            'show_avatar' => 'true',
            'show_stats' => 'true',
            'show_rank' => 'true',
            'show_logout' => 'true',
            'title' => 'Mon Profil'
        ), $atts);
        
        // Initialiser l'authentification
        $auth = new Duel_Auth();
        
        // Vérifier si l'utilisateur est connecté
        if (!$auth->is_logged_in()) {
            return self::render_not_logged_in();
        }
        
        // Récupérer le profil actualisé
        $user_profile = $auth->get_current_user_profile();
        
        if (!$user_profile) {
            return '<div class="duel-profile-container"><div class="duel-error">Erreur lors du chargement du profil</div></div>';
        }
        
        // Gérer la déconnexion
        if (isset($_POST['duel_action']) && $_POST['duel_action'] === 'logout') {
            if (wp_verify_nonce($_POST['duel_nonce'], 'duel_logout_nonce')) {
                $auth->logout();
                wp_redirect($_SERVER['REQUEST_URI']);
                exit;
            }
        }
        
        // Gérer le changement de catégorie
        $category_message = '';
        if (isset($_POST['duel_action']) && $_POST['duel_action'] === 'update_category') {
            if (wp_verify_nonce($_POST['duel_nonce'], 'duel_category_nonce')) {
                $new_category = sanitize_text_field($_POST['categorie']);
                
                if (in_array($new_category, array('JUNIOR', 'SENIOR'))) {
                    $api_client = new Duel_API_Client();
                    $token = $auth->get_token();
                    
                    $result = $api_client->update_dueliste_categorie(
                        $user_profile['id'], 
                        $new_category, 
                        $token
                    );
                    
                    if (isset($result['success']) && $result['success']) {
                        $category_message = '<div class="duel-success">Catégorie mise à jour avec succès !</div>';
                        // Rafraîchir le profil
                        $user_profile = $auth->get_current_user_profile();
                    } else {
                        $error_msg = isset($result['message']) ? $result['message'] : 'Erreur lors de la mise à jour';
                        $category_message = '<div class="duel-error">' . esc_html($error_msg) . '</div>';
                    }
                } else {
                    $category_message = '<div class="duel-error">Catégorie invalide</div>';
                }
            }
        }
        
        // Générer le HTML
        ob_start();
        ?>
        <div class="duel-profile-container">
            <div class="duel-profile">
                
                <?php if (!empty($atts['title'])): ?>
                    <h3 class="duel-profile-title"><?php echo esc_html($atts['title']); ?></h3>
                <?php endif; ?>
                
                <?php if ($atts['show_avatar'] === 'true'): ?>
                    <div class="duel-profile-avatar">
                        <?php 
                        $avatar_url = $user_profile['avatarUrl'] ?? null;
                        
                        // Si avatarUrl est un chemin relatif, construire l'URL complète
                        if (!empty($avatar_url)) {
                            if (strpos($avatar_url, '/') === 0) {
                                $avatar_url = 'https://api-duel.benribs.fr' . $avatar_url;
                            }
                        }
                        
                        $has_valid_avatar = !empty($avatar_url);
                        ?>
                        <?php if ($has_valid_avatar): ?>
                            <img src="<?php echo esc_url($avatar_url); ?>" 
                                 alt="Avatar de <?php echo esc_attr($user_profile['pseudo']); ?>"
                                 class="duel-avatar-img"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="duel-avatar-fallback" style="display: none;">
                                <?php echo esc_html(strtoupper(substr($user_profile['pseudo'], 0, 2))); ?>
                            </div>
                        <?php else: ?>
                            <div class="duel-avatar-initials">
                                <?php echo esc_html(strtoupper(substr($user_profile['pseudo'], 0, 2))); ?>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endif; ?>
                
                <div class="duel-profile-info">
                    <h2 class="duel-profile-pseudo"><?php echo esc_html($user_profile['pseudo']); ?></h2>
                    
                    <?php if (!empty($user_profile['categorie'])): ?>
                        <div class="duel-profile-category">
                            <span class="duel-category-badge duel-category-<?php echo esc_attr(strtolower($user_profile['categorie'])); ?>">
                                <?php echo esc_html($user_profile['categorie']); ?>
                            </span>
                        </div>
                    <?php endif; ?>
                    
                    <?php if (!empty($user_profile['email']) && $user_profile['authMode'] === 'OTP'): ?>
                        <p class="duel-profile-email">
                            <small>📧 <?php echo esc_html($user_profile['email']); ?></small>
                        </p>
                    <?php endif; ?>
                </div>
                
                <?php if ($atts['show_stats'] === 'true'): ?>
                    <div class="duel-profile-stats">
                        <div class="duel-stat-box">
                            <span class="duel-stat-value"><?php echo intval($user_profile['nbVictoires']); ?></span>
                            <span class="duel-stat-label">Victoires</span>
                        </div>
                        <div class="duel-stat-box">
                            <span class="duel-stat-value"><?php echo intval($user_profile['nbDefaites']); ?></span>
                            <span class="duel-stat-label">Défaites</span>
                        </div>
                        <div class="duel-stat-box">
                            <span class="duel-stat-value"><?php echo intval($user_profile['nbMatchsTotal']); ?></span>
                            <span class="duel-stat-label">Matchs</span>
                        </div>
                    </div>
                <?php endif; ?>
                
                <?php if ($atts['show_rank'] === 'true'): ?>
                    <?php 
                    $ratio = $user_profile['nbMatchsTotal'] > 0 ? 
                        round(($user_profile['nbVictoires'] / $user_profile['nbMatchsTotal']) * 100, 1) : 0;
                    ?>
                    <div class="duel-profile-performance">
                        <div class="duel-performance-item">
                            <span class="duel-performance-label">Ratio victoires</span>
                            <span class="duel-performance-value"><?php echo $ratio; ?>%</span>
                        </div>
                        
                        <?php if (isset($user_profile['indiceTouches'])): ?>
                            <div class="duel-performance-item">
                                <span class="duel-performance-label">Indice touches</span>
                                <span class="duel-performance-value"><?php echo intval($user_profile['indiceTouches']); ?></span>
                            </div>
                        <?php endif; ?>
                        
                        <div class="duel-performance-item">
                            <span class="duel-performance-label">Membre depuis</span>
                            <span class="duel-performance-value">
                                <?php 
                                $date_inscription = new DateTime($user_profile['dateInscription']);
                                echo $date_inscription->format('M Y');
                                ?>
                            </span>
                        </div>
                    </div>
                <?php endif; ?>
                
                <!-- Message de retour pour changement de catégorie -->
                <?php if (!empty($category_message)): ?>
                    <?php echo $category_message; ?>
                <?php endif; ?>
                
                <!-- Formulaire de changement de catégorie -->
                <div class="duel-profile-category-change">
                    <h4>Modifier ma catégorie</h4>
                    <form method="post" action="" class="duel-category-form">
                        <?php wp_nonce_field('duel_category_nonce', 'duel_nonce'); ?>
                        <input type="hidden" name="duel_action" value="update_category">
                        
                        <div class="duel-category-options">
                            <label class="duel-category-option">
                                <input type="radio" name="categorie" value="JUNIOR" 
                                       <?php echo (isset($user_profile['categorie']) && $user_profile['categorie'] === 'JUNIOR') ? 'checked' : ''; ?>>
                                <span class="duel-category-label">
                                    <span class="duel-category-badge duel-category-junior">Junior</span>
                                    <small>Moins de 15 ans</small>
                                </span>
                            </label>
                            
                            <label class="duel-category-option">
                                <input type="radio" name="categorie" value="SENIOR" 
                                       <?php echo (isset($user_profile['categorie']) && $user_profile['categorie'] === 'SENIOR') ? 'checked' : ''; ?>>
                                <span class="duel-category-label">
                                    <span class="duel-category-badge duel-category-senior">Adulte</span>
                                    <small>15 ans et plus</small>
                                </span>
                            </label>
                        </div>
                        
                        <button type="submit" class="duel-btn duel-btn-primary duel-btn-small">
                            Mettre à jour
                        </button>
                    </form>
                </div>
                
                <?php if ($atts['show_logout'] === 'true'): ?>
                    <div class="duel-profile-actions">
                        <form method="post" action="">
                            <?php wp_nonce_field('duel_logout_nonce', 'duel_nonce'); ?>
                            <input type="hidden" name="duel_action" value="logout">
                            <button type="submit" class="duel-btn duel-btn-secondary">
                                Se déconnecter
                            </button>
                        </form>
                    </div>
                <?php endif; ?>
                
            </div>
        </div>
        
        <style>
        .duel-profile-title {
            text-align: center;
            margin-bottom: 20px;
            color: #1f2937;
        }
        
        .duel-avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
        }
        
        .duel-profile-category {
            text-align: center;
            margin-bottom: 15px;
        }
        
        .duel-category-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .duel-category-senior {
            background: #dbeafe;
            color: #1e40af;
        }
        
        .duel-category-junior {
            background: #dcfce7;
            color: #166534;
        }
        
        .duel-category-veteran {
            background: #fef3c7;
            color: #92400e;
        }
        
        .duel-profile-email {
            text-align: center;
            margin-bottom: 15px;
            color: #6b7280;
        }
        
        .duel-profile-performance {
            background: #f8fafc;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .duel-performance-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .duel-performance-item:last-child {
            border-bottom: none;
        }
        
        .duel-performance-label {
            font-size: 14px;
            color: #6b7280;
        }
        
        .duel-performance-value {
            font-size: 14px;
            font-weight: 600;
            color: #1f2937;
        }
        
        .duel-profile-actions {
            text-align: center;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
        }
        
        /* Styles pour le formulaire de changement de catégorie */
        .duel-profile-category-change {
            margin: 20px 0;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        
        .duel-profile-category-change h4 {
            margin: 0 0 15px 0;
            font-size: 16px;
            color: #1f2937;
            font-weight: 600;
        }
        
        .duel-category-options {
            display: flex;
            gap: 15px;
            margin-bottom: 15px;
            flex-wrap: wrap;
        }
        
        .duel-category-option {
            flex: 1;
            cursor: pointer;
            min-width: 120px;
        }
        
        .duel-category-option input[type="radio"] {
            display: none;
        }
        
        .duel-category-label {
            display: block;
            padding: 12px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            background: white;
            text-align: center;
            transition: all 0.2s ease;
        }
        
        .duel-category-option:hover .duel-category-label {
            border-color: #d1d5db;
            background: #f9fafb;
        }
        
        .duel-category-option input[type="radio"]:checked + .duel-category-label {
            border-color: #3b82f6;
            background: #eff6ff;
        }
        
        .duel-category-label small {
            display: block;
            margin-top: 5px;
            font-size: 11px;
            color: #6b7280;
        }
        
        .duel-btn-small {
            padding: 8px 16px;
            font-size: 14px;
        }
        </style>
        <?php
        return ob_get_clean();
    }
    
    /**
     * Message pour utilisateur non connecté
     */
    private static function render_not_logged_in() {
        ob_start();
        ?>
        <div class="duel-profile-container">
            <div class="duel-profile-login-required">
                <div class="duel-profile-avatar">
                    ?
                </div>
                <h3>Connexion requise</h3>
                <p>Vous devez être connecté pour voir votre profil.</p>
                <a href="https://escrime-cey.fr/connexion-duel-by-benribs-lab/" class="duel-btn duel-btn-primary duel-login-link">
                    Se connecter
                </a>
            </div>
        </div>
        
        <style>
        .duel-profile-login-required {
            text-align: center;
            padding: 40px 20px;
        }
        
        .duel-profile-login-required h3 {
            margin: 20px 0 10px 0;
            color: #374151;
        }
        
        .duel-profile-login-required p {
            margin-bottom: 20px;
            color: #6b7280;
        }
        </style>
        <?php
        return ob_get_clean();
    }
}

// Gestion AJAX pour le rafraîchissement du profil
add_action('wp_ajax_duel_refresh_profile', 'duel_refresh_profile_callback');
add_action('wp_ajax_nopriv_duel_refresh_profile', 'duel_refresh_profile_callback');

function duel_refresh_profile_callback() {
    check_ajax_referer('duel_ajax_nonce', 'nonce');
    
    $auth = new Duel_Auth();
    
    if (!$auth->is_logged_in()) {
        wp_send_json_error('Non connecté');
        return;
    }
    
    $profile = $auth->get_current_user_profile();
    
    if ($profile) {
        wp_send_json_success($profile);
    } else {
        wp_send_json_error('Erreur lors du chargement du profil');
    }
}