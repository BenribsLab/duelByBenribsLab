<?php
/**
 * Classe pour communiquer avec l'API Duel by Benribs Lab
 */

if (!defined('ABSPATH')) {
    exit;
}

class Duel_API_Client {
    
    /**
     * URL de base de l'API
     */
    private $api_base_url;
    
    /**
     * Constructeur
     */
    public function __construct() {
        $this->api_base_url = get_option('duel_api_base_url', DUEL_API_BASE_URL);
    }
    
    /**
     * Effectuer une requête HTTP vers l'API
     * 
     * @param string $endpoint L'endpoint de l'API (ex: 'auth/login')
     * @param array $data Les données à envoyer
     * @param string $method La méthode HTTP (GET, POST, PUT, DELETE)
     * @param string $token Token d'authentification optionnel
     * @return array Réponse de l'API
     */
    public function make_request($endpoint, $data = array(), $method = 'GET', $token = null) {
        $url = rtrim($this->api_base_url, '/') . '/' . ltrim($endpoint, '/');
        
        $args = array(
            'method' => $method,
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
            'timeout' => 30,
        );
        
        // Ajouter le token d'authentification si fourni
        if ($token) {
            $args['headers']['Authorization'] = 'Bearer ' . $token;
        }
        
        // Ajouter les données pour POST/PUT
        if (in_array($method, array('POST', 'PUT', 'PATCH')) && !empty($data)) {
            $args['body'] = json_encode($data);
        }
        
        // Effectuer la requête
        $response = wp_remote_request($url, $args);
        
        // Vérifier les erreurs
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'error' => 'Erreur de connexion à l\'API: ' . $response->get_error_message()
            );
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        
        // Décoder la réponse JSON
        $decoded_body = json_decode($body, true);
        
        if ($decoded_body === null) {
            return array(
                'success' => false,
                'error' => 'Réponse API invalide'
            );
        }
        
        // Ajouter le code de statut à la réponse
        $decoded_body['status_code'] = $status_code;
        
        return $decoded_body;
    }
    
    /**
     * Connexion avec pseudo et mot de passe
     * 
     * @param string $pseudo Le pseudo de l'utilisateur
     * @param string $password Le mot de passe
     * @return array Réponse de l'API
     */
    public function login_with_password($pseudo, $password) {
        return $this->make_request('auth/login', array(
            'pseudo' => $pseudo,
            'password' => $password
        ), 'POST');
    }
    
    /**
     * Demander un code OTP pour un email
     * 
     * @param string $email L'email de l'utilisateur
     * @return array Réponse de l'API
     */
    public function request_otp($email) {
        return $this->make_request('auth/login', array(
            'email' => $email
        ), 'POST');
    }
    
    /**
     * Vérifier un code OTP
     * 
     * @param string $email L'email de l'utilisateur
     * @param string $otp_code Le code OTP
     * @return array Réponse de l'API
     */
    public function verify_otp($email, $otp_code) {
        return $this->make_request('auth/verify-otp', array(
            'email' => $email,
            'otpCode' => $otp_code
        ), 'POST');
    }
    
    /**
     * Inscription avec mot de passe
     * 
     * @param string $pseudo Le pseudo
     * @param string $password Le mot de passe
     * @param string $email L'email (optionnel)
     * @return array Réponse de l'API
     */
    public function register_with_password($pseudo, $password, $email = null) {
        $data = array(
            'pseudo' => $pseudo,
            'password' => $password,
            'authMode' => 'PASSWORD',
            'hasEmailAccess' => false
        );
        
        if ($email) {
            $data['email'] = $email;
        }
        
        return $this->make_request('auth/register', $data, 'POST');
    }
    
    /**
     * Inscription avec OTP
     * 
     * @param string $pseudo Le pseudo
     * @param string $email L'email
     * @return array Réponse de l'API
     */
    public function register_with_otp($pseudo, $email) {
        return $this->make_request('auth/register', array(
            'pseudo' => $pseudo,
            'email' => $email,
            'authMode' => 'OTP',
            'hasEmailAccess' => true
        ), 'POST');
    }
    
    /**
     * Obtenir le profil de l'utilisateur connecté
     * 
     * @param string $token Le token d'authentification
     * @return array Réponse de l'API
     */
    public function get_profile($token) {
        return $this->make_request('auth/me', array(), 'GET', $token);
    }
    
    /**
     * Récupérer le classement (appel public sans authentification)
     */
    public function get_classement($type = 'general', $limit = 10) {
        $endpoint = ($type === 'junior') ? 'classement/junior' : 'classement';
        
        $params = array(
            'limit' => intval($limit)
        );
        
        // Utilisation correcte de make_request avec les paramètres en query string
        $endpoint_with_params = $endpoint . '?' . http_build_query($params);
        
        // Appel sans authentification car l'endpoint est public
        return $this->make_request($endpoint_with_params, array(), 'GET');
    }
    
    /**
     * Obtenir les statistiques d'un dueliste
     * 
     * @param int $dueliste_id L'ID du dueliste
     * @param string $token Le token d'authentification
     * @return array Réponse de l'API
     */
    public function get_dueliste_stats($dueliste_id, $token = null) {
        return $this->make_request("classement/dueliste/{$dueliste_id}", array(), 'GET', $token);
    }
    
    /**
     * Vérifier si un token est valide
     * 
     * @param string $token Le token à vérifier
     * @return bool True si le token est valide, false sinon
     */
    public function is_token_valid($token) {
        $response = $this->get_profile($token);
        return isset($response['success']) && $response['success'] === true;
    }
    
    /**
     * MÉTHODES DUELS
     */
    
    /**
     * Récupérer les duels d'un utilisateur
     */
    public function get_my_duels($dueliste_id, $token) {
        $endpoint = 'duels?duelisteId=' . intval($dueliste_id);
        return $this->make_request($endpoint, array(), 'GET', $token);
    }
    
    /**
     * Créer un nouveau duel
     */
    public function create_duel($duel_data, $token) {
        return $this->make_request('duels', $duel_data, 'POST', $token);
    }
    
    /**
     * Accepter un duel
     */
    public function accept_duel($duel_id, $data, $token) {
        $endpoint = 'duels/' . intval($duel_id) . '/accepter';
        return $this->make_request($endpoint, $data, 'PUT', $token);
    }
    
    /**
     * Refuser un duel
     */
    public function refuse_duel($duel_id, $data, $token) {
        $endpoint = 'duels/' . intval($duel_id) . '/refuser';
        return $this->make_request($endpoint, $data, 'PUT', $token);
    }
    
    /**
     * Valider un score de duel
     */
    public function validate_score($duel_id, $score_data, $token) {
        $endpoint = 'duels/' . intval($duel_id) . '/score';
        return $this->make_request($endpoint, $score_data, 'PUT', $token);
    }
    
    /**
     * Récupérer tous les duellistes (pour le formulaire nouveau duel)
     */
    public function get_all_duellistes($token) {
        return $this->make_request('duellistes', array(), 'GET', $token);
    }
    
    /**
     * Tester la connexion à l'API
     * 
     * @return array Résultat du test
     */
    public function test_connection() {
        $response = $this->make_request('classement', array(), 'GET');
        
        if (isset($response['success'])) {
            return array(
                'success' => true,
                'message' => 'Connexion à l\'API réussie'
            );
        } else {
            return array(
                'success' => false,
                'message' => 'Impossible de se connecter à l\'API'
            );
        }
    }
}