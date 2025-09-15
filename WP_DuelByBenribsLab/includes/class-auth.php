<?php
/**
 * Classe de gestion de l'authentification pour le plugin Duel
 */

if (!defined('ABSPATH')) {
    exit;
}

class Duel_Auth {
    
    /**
     * Instance du client API
     */
    private $api_client;
    
    /**
     * Constructeur
     */
    public function __construct() {
        $this->api_client = new Duel_API_Client();
    }
    
    /**
     * Stocker le token et les données utilisateur en session
     * 
     * @param string $token Le token JWT
     * @param array $user_data Les données de l'utilisateur
     */
    public function store_auth_data($token, $user_data) {
        $_SESSION['duel_token'] = $token;
        $_SESSION['duel_user'] = $user_data;
        $_SESSION['duel_login_time'] = time();
    }
    
    /**
     * Récupérer le token stocké
     * 
     * @return string|null Le token ou null si non trouvé
     */
    public function get_token() {
        return isset($_SESSION['duel_token']) ? $_SESSION['duel_token'] : null;
    }
    
    /**
     * Récupérer les données utilisateur stockées
     * 
     * @return array|null Les données utilisateur ou null si non trouvées
     */
    public function get_user_data() {
        return isset($_SESSION['duel_user']) ? $_SESSION['duel_user'] : null;
    }
    
    /**
     * Vérifier si l'utilisateur est connecté
     * 
     * @return bool True si connecté, false sinon
     */
    public function is_logged_in() {
        $token = $this->get_token();
        
        if (!$token) {
            return false;
        }
        
        // Vérifier si le token est encore valide
        if (!$this->api_client->is_token_valid($token)) {
            // Token invalide, nettoyer la session
            $this->logout();
            return false;
        }
        
        return true;
    }
    
    /**
     * Déconnecter l'utilisateur
     */
    public function logout() {
        unset($_SESSION['duel_token']);
        unset($_SESSION['duel_user']);
        unset($_SESSION['duel_login_time']);
    }
    
    /**
     * Connexion avec identifiant (email ou pseudo)
     * 
     * @param string $identifier Email ou pseudo
     * @return array Résultat de la tentative de connexion
     */
    public function login_step1($identifier) {
        // Déterminer si c'est un email ou un pseudo
        if (filter_var($identifier, FILTER_VALIDATE_EMAIL)) {
            // C'est un email, demander un OTP
            $response = $this->api_client->request_otp($identifier);
            
            if (isset($response['success']) && $response['success']) {
                return array(
                    'success' => true,
                    'step' => 'otp',
                    'identifier' => $identifier,
                    'message' => 'Code OTP envoyé à votre email'
                );
            } else {
                return array(
                    'success' => false,
                    'error' => $response['error'] ?? 'Email non trouvé',
                    'suggest_register' => true
                );
            }
        } else {
            // C'est un pseudo, demander le mot de passe
            return array(
                'success' => true,
                'step' => 'password',
                'identifier' => $identifier,
                'message' => 'Entrez votre mot de passe'
            );
        }
    }
    
    /**
     * Connexion avec mot de passe (étape 2 pour les pseudos)
     * 
     * @param string $pseudo Le pseudo
     * @param string $password Le mot de passe
     * @return array Résultat de la connexion
     */
    public function login_with_password($pseudo, $password) {
        $response = $this->api_client->login_with_password($pseudo, $password);
        
        if (isset($response['success']) && $response['success']) {
            // Stocker les données de connexion
            $this->store_auth_data(
                $response['data']['token'],
                $response['data']['user']
            );
            
            return array(
                'success' => true,
                'message' => 'Connexion réussie'
            );
        } else {
            return array(
                'success' => false,
                'error' => $response['error'] ?? 'Pseudo ou mot de passe incorrect',
                'suggest_register' => true
            );
        }
    }
    
    /**
     * Vérification du code OTP (étape 2 pour les emails)
     * 
     * @param string $email L'email
     * @param string $otp_code Le code OTP
     * @return array Résultat de la vérification
     */
    public function verify_otp($email, $otp_code) {
        $response = $this->api_client->verify_otp($email, $otp_code);
        
        if (isset($response['success']) && $response['success']) {
            // Stocker les données de connexion
            $this->store_auth_data(
                $response['data']['token'],
                $response['data']['user']
            );
            
            return array(
                'success' => true,
                'message' => 'Connexion réussie'
            );
        } else {
            return array(
                'success' => false,
                'error' => $response['error'] ?? 'Code OTP invalide'
            );
        }
    }
    
    /**
     * Inscription avec mot de passe
     * 
     * @param string $pseudo Le pseudo
     * @param string $password Le mot de passe
     * @param string $email L'email (optionnel)
     * @return array Résultat de l'inscription
     */
    public function register_with_password($pseudo, $password, $email = null) {
        $response = $this->api_client->register_with_password($pseudo, $password, $email);
        
        if (isset($response['success']) && $response['success']) {
            return array(
                'success' => true,
                'message' => 'Inscription réussie ! Vous pouvez maintenant vous connecter.'
            );
        } else {
            return array(
                'success' => false,
                'error' => $response['error'] ?? 'Erreur lors de l\'inscription'
            );
        }
    }
    
    /**
     * Inscription avec OTP
     * 
     * @param string $pseudo Le pseudo
     * @param string $email L'email
     * @return array Résultat de l'inscription
     */
    public function register_with_otp($pseudo, $email) {
        $response = $this->api_client->register_with_otp($pseudo, $email);
        
        if (isset($response['success']) && $response['success']) {
            if (isset($response['data']['requiresOTP']) && $response['data']['requiresOTP']) {
                return array(
                    'success' => true,
                    'step' => 'otp',
                    'email' => $email,
                    'message' => 'Code OTP envoyé à votre email pour finaliser l\'inscription'
                );
            } else {
                return array(
                    'success' => true,
                    'message' => 'Inscription réussie !'
                );
            }
        } else {
            return array(
                'success' => false,
                'error' => $response['error'] ?? 'Erreur lors de l\'inscription'
            );
        }
    }
    
    /**
     * Obtenir le profil utilisateur actualisé
     * 
     * @return array|null Le profil utilisateur ou null si non connecté
     */
    public function get_current_user_profile() {
        if (!$this->is_logged_in()) {
            return null;
        }
        
        $token = $this->get_token();
        $basic_user = $this->get_user_data();
        
        // Récupérer les données complètes depuis l'API /duellistes
        $duellistes_response = $this->api_client->make_request('duellistes', array(), 'GET', $token);
        
        if (isset($duellistes_response['success']) && $duellistes_response['success']) {
            // Chercher l'utilisateur connecté dans la liste
            $duellistes = $duellistes_response['data'] ?? array();
            
            foreach ($duellistes as $dueliste) {
                if ($dueliste['id'] === $basic_user['id']) {
                    // Mettre à jour les données en session avec les stats complètes
                    $_SESSION['duel_user'] = $dueliste;
                    return $dueliste;
                }
            }
        }
        
        // Fallback : retourner les données de base si pas trouvé
        return $basic_user;
    }
    
    /**
     * Vérifier si une session a expiré (après 7 jours par défaut)
     * 
     * @return bool True si la session a expiré, false sinon
     */
    public function is_session_expired() {
        if (!isset($_SESSION['duel_login_time'])) {
            return true;
        }
        
        $login_time = $_SESSION['duel_login_time'];
        $current_time = time();
        $session_duration = 7 * 24 * 60 * 60; // 7 jours en secondes
        
        return ($current_time - $login_time) > $session_duration;
    }
    
    /**
     * Nettoyer les sessions expirées
     */
    public function cleanup_expired_sessions() {
        if ($this->is_session_expired()) {
            $this->logout();
        }
    }
}