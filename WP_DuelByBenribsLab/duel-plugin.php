<?php
/**
 * Plugin Name: Duel by Benribs Lab
 * Plugin URI: https://duel.benribs.fr
 * Description: Plugin WordPress pour intégrer les fonctionnalités de duels d'escrime via l'API Duel by Benribs Lab
 * Version: 1.0.0
 * Author: Benribs Lab
 * License: MIT
 * Text Domain: duel-benribs
 * Domain Path: /languages
 */

// Empêcher l'accès direct
if (!defined('ABSPATH')) {
    exit;
}

// Définir les constantes du plugin
define('DUEL_PLUGIN_VERSION', '1.0.0');
define('DUEL_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('DUEL_PLUGIN_URL', plugin_dir_url(__FILE__));
define('DUEL_PLUGIN_BASENAME', plugin_basename(__FILE__));

// URL de l'API par défaut (configurable dans l'admin)
define('DUEL_API_BASE_URL', 'https://duel.benribs.fr/api');

/**
 * Classe principale du plugin
 */
class DuelByBenribsLab {
    
    /**
     * Instance unique du plugin
     */
    private static $instance = null;
    
    /**
     * Obtenir l'instance unique du plugin
     */
    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructeur privé
     */
    private function __construct() {
        $this->init();
    }
    
    /**
     * Initialisation du plugin
     */
    private function init() {
        // Hook d'activation
        register_activation_hook(__FILE__, array($this, 'activate'));
        
        // Hook de désactivation
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Initialiser le plugin après le chargement de WordPress
        add_action('init', array($this, 'init_plugin'));
        
        // Charger les styles et scripts
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        
        // Charger les fichiers nécessaires
        $this->load_dependencies();
    }
    
    /**
     * Charger les dépendances
     */
    private function load_dependencies() {
        // Classe de communication avec l'API
        require_once DUEL_PLUGIN_PATH . 'includes/class-api-client.php';
        
        // Classe de gestion de l'authentification
        require_once DUEL_PLUGIN_PATH . 'includes/class-auth.php';
        
        // Shortcodes
        require_once DUEL_PLUGIN_PATH . 'includes/shortcodes/login.php';
        require_once DUEL_PLUGIN_PATH . 'includes/shortcodes/register.php';
        require_once DUEL_PLUGIN_PATH . 'includes/shortcodes/profile.php';
        require_once DUEL_PLUGIN_PATH . 'includes/shortcodes/home.php';
        require_once DUEL_PLUGIN_PATH . 'includes/shortcodes/classement.php';
        require_once DUEL_PLUGIN_PATH . 'includes/shortcodes/duels.php';
    }
    
    /**
     * Initialisation du plugin
     */
    public function init_plugin() {
        // Démarrer la session si nécessaire
        if (!session_id()) {
            session_start();
        }
        
        // Traiter les actions de duels AVANT l'affichage
        $this->handle_duel_actions();
        
        // Enregistrer les shortcodes
        $this->register_shortcodes();
    }
    
    /**
     * Enregistrer les shortcodes
     */
    private function register_shortcodes() {
        add_shortcode('duel_login', array('Duel_Login_Shortcode', 'render'));
        add_shortcode('duel_register', array('Duel_Register_Shortcode', 'render'));
        add_shortcode('duel_profile', array('Duel_Profile_Shortcode', 'render'));
        add_shortcode('duel_home', array('Duel_Home_Shortcode', 'render'));
        // Le shortcode classement est enregistré dans son propre fichier
    }
    
    /**
     * Traiter les actions de duels avant l'affichage
     */
    private function handle_duel_actions() {
        if (isset($_POST['duel_action'])) {
            
            // Traiter la déconnexion
            if ($_POST['duel_action'] === 'logout') {
                if (wp_verify_nonce($_POST['duel_nonce'], 'duel_logout_nonce')) {
                    if (class_exists('Duel_Auth')) {
                        $auth = new Duel_Auth();
                        $auth->logout();
                        wp_redirect($_SERVER['REQUEST_URI']);
                        exit;
                    }
                }
                return;
            }
            
            // Traiter les actions de connexion/inscription
            if (in_array($_POST['duel_action'], ['login_step1', 'login_password', 'verify_otp', 'back_to_start'])) {
                if (class_exists('Duel_Auth')) {
                    $auth = new Duel_Auth();
                    
                    // Traiter selon le type d'action
                    if ($_POST['duel_action'] === 'back_to_start') {
                        wp_redirect($_SERVER['REQUEST_URI']);
                        exit;
                    }
                    
                    // Autres actions de connexion
                    $this->handle_auth_actions($auth);
                }
                return;
            }
            
            // Traiter les actions de duels seulement si connecté
            if (isset($_SESSION['duel_token']) && isset($_SESSION['duel_user'])) {
                // Inclure les classes nécessaires
                if (class_exists('Duel_API_Client')) {
                    $api_client = new Duel_API_Client();
                    $token = $_SESSION['duel_token'];
                    $user = $_SESSION['duel_user'];
                    
                    // Traiter l'action et rediriger
                    if (function_exists('handle_duel_action')) {
                        handle_duel_action($api_client, $token, $user);
                    }
                }
            }
        }
    }
    
    /**
     * Traiter les actions d'authentification
     */
    private function handle_auth_actions($auth) {
        if (!wp_verify_nonce($_POST['duel_nonce'], 'duel_login_nonce')) {
            return;
        }
        
        switch ($_POST['duel_action']) {
            case 'login_step1':
                $identifier = sanitize_text_field($_POST['identifier']);
                if (!empty($identifier)) {
                    $result = $auth->login_step1($identifier);
                    // Stocker le résultat en session pour l'affichage
                    $_SESSION['duel_login_step'] = $result;
                    if (isset($result['success']) && $result['success']) {
                        wp_redirect($_SERVER['REQUEST_URI']);
                        exit;
                    }
                }
                break;
                
            case 'login_password':
                $pseudo = sanitize_text_field($_POST['pseudo']);
                $password = $_POST['password'];
                if (!empty($pseudo) && !empty($password)) {
                    $result = $auth->login_with_password($pseudo, $password);
                    if (isset($result['success']) && $result['success']) {
                        // Supprimer les données de session après connexion réussie
                        unset($_SESSION['duel_login_step']);
                        wp_redirect($_SERVER['REQUEST_URI']);
                        exit;
                    } else {
                        $_SESSION['duel_login_step'] = $result;
                    }
                }
                break;
                
            case 'verify_otp':
                $email = sanitize_email($_POST['email']);
                $otp_code = sanitize_text_field($_POST['otp_code']);
                if (!empty($email) && !empty($otp_code)) {
                    $result = $auth->verify_otp($email, $otp_code);
                    if (isset($result['success']) && $result['success']) {
                        // Supprimer les données de session après connexion réussie
                        unset($_SESSION['duel_login_step']);
                        wp_redirect($_SERVER['REQUEST_URI']);
                        exit;
                    } else {
                        $_SESSION['duel_login_step'] = $result;
                    }
                }
                break;
        }
    }
    
    /**
     * Charger les styles et scripts
     */
    public function enqueue_scripts() {
        // CSS du plugin
        wp_enqueue_style(
            'duel-plugin-style',
            DUEL_PLUGIN_URL . 'assets/style.css',
            array(),
            DUEL_PLUGIN_VERSION
        );
        
        // JavaScript pour les formulaires dynamiques
        wp_enqueue_script(
            'duel-plugin-script',
            DUEL_PLUGIN_URL . 'assets/script.js',
            array('jquery'),
            DUEL_PLUGIN_VERSION,
            true
        );
        
        // Passer l'URL AJAX au JavaScript
        wp_localize_script('duel-plugin-script', 'duel_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('duel_ajax_nonce')
        ));
    }
    
    /**
     * Activation du plugin
     */
    public function activate() {
        // Créer les options par défaut
        add_option('duel_api_base_url', DUEL_API_BASE_URL);
        
        // Vider le cache des règles de réécriture
        flush_rewrite_rules();
    }
    
    /**
     * Désactivation du plugin
     */
    public function deactivate() {
        // Nettoyer les sessions
        if (session_id()) {
            unset($_SESSION['duel_token']);
            unset($_SESSION['duel_user']);
        }
        
        // Vider le cache des règles de réécriture
        flush_rewrite_rules();
    }
}

// Initialiser le plugin
DuelByBenribsLab::get_instance();