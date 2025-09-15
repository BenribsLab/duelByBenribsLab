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
        // Le shortcode classement est enregistré dans son propre fichier
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