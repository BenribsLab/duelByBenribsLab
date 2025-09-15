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
                        $avatar_data = $user_profile['avatarUrl'] ?? null;
                        ?>
                        <?php if (!empty($avatar_data) && $avatar_data !== null): ?>
                            <img src="<?php echo esc_attr($avatar_data); ?>" 
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
                <a href="#" class="duel-btn duel-btn-primary duel-login-link">
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