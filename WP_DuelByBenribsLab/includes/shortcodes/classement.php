<?php
/**
 * Shortcode Classement - Affichage du classement général ou junior
 */

// Empêcher l'accès direct
if (!defined('ABSPATH')) {
    exit;
}

function duel_classement_shortcode($atts) {
    // Attributs par défaut
    $atts = shortcode_atts(array(
        'type' => 'general',  // 'general' ou 'junior'
        'max' => '10',        // Nombre maximum d'entrées à afficher
        'titre' => '',        // Titre optionnel
    ), $atts);

    // Validation des paramètres
    $type = in_array($atts['type'], array('general', 'junior')) ? $atts['type'] : 'general';
    $max = intval($atts['max']);
    if ($max <= 0 || $max > 100) {
        $max = 10; // Valeur par défaut
    }

    // Vérification de l'existence de la classe
    if (!class_exists('Duel_API_Client')) {
        return '<div class="duel-error">Plugin non initialisé correctement.</div>';
    }

    $api_client = new Duel_API_Client();
    
    try {
        // Appel API pour récupérer le classement
        $classement_data = $api_client->get_classement($type, $max);
        
        if (!$classement_data || !isset($classement_data['success']) || !$classement_data['success']) {
            return '<div class="duel-error">Erreur lors du chargement du classement.</div>';
        }

        $classement = isset($classement_data['data']) ? $classement_data['data'] : array();
        
        if (empty($classement)) {
            return '<div class="duel-info">Aucun classement disponible pour le moment.</div>';
        }

        // Générer le HTML
        ob_start();
        ?>
        <div class="duel-classement-container">
            <?php if (!empty($atts['titre'])): ?>
                <h3 class="duel-classement-titre"><?php echo esc_html($atts['titre']); ?></h3>
            <?php endif; ?>
            
            <div class="duel-classement-header">
                <h4><?php echo $type === 'junior' ? 'Classement Junior' : 'Classement Général'; ?></h4>
                <span class="duel-classement-info"><?php echo count($classement); ?> duelliste(s)</span>
            </div>

            <div class="duel-classement-table">
                <div class="duel-classement-row duel-classement-header-row">
                    <div class="duel-rank-cell">Rang</div>
                    <div class="duel-avatar-cell">Avatar</div>
                    <div class="duel-pseudo-cell">Pseudo</div>
                    <div class="duel-stats-cell">V/D</div>
                    <div class="duel-matches-cell">Matchs</div>
                    <div class="duel-touches-cell">Indice</div>
                    <div class="duel-winrate-cell">Taux</div>
                </div>

                <?php foreach ($classement as $index => $dueliste): ?>
                    <div class="duel-classement-row">
                        <div class="duel-rank-cell">
                            <span class="duel-rank"><?php echo intval(isset($dueliste['rang']) ? $dueliste['rang'] : ($index + 1)); ?></span>
                        </div>
                        
                        <div class="duel-avatar-cell">
                            <?php 
                            $avatar_data = isset($dueliste['avatarUrl']) ? $dueliste['avatarUrl'] : null;
                            $pseudo = isset($dueliste['pseudo']) ? $dueliste['pseudo'] : 'Dueliste';
                            $initiales = strtoupper(substr($pseudo, 0, 2));
                            ?>
                            <?php if (!empty($avatar_data)): ?>
                                <img src="<?php echo esc_attr($avatar_data); ?>" 
                                     alt="Avatar de <?php echo esc_attr($pseudo); ?>"
                                     class="duel-classement-avatar"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div class="duel-classement-avatar-fallback" style="display: none;">
                                    <?php echo esc_html($initiales); ?>
                                </div>
                            <?php else: ?>
                                <div class="duel-classement-avatar-initials">
                                    <?php echo esc_html($initiales); ?>
                                </div>
                            <?php endif; ?>
                        </div>
                        
                        <div class="duel-pseudo-cell">
                            <span class="duel-pseudo"><?php echo esc_html($pseudo); ?></span>
                            <?php if (!empty($dueliste['categorie']) && strtolower($dueliste['categorie']) === 'junior'): ?>
                                <span class="duel-categorie duel-categorie-junior">
                                    Junior
                                </span>
                            <?php endif; ?>
                        </div>
                        
                        <div class="duel-stats-cell">
                            <span class="duel-victoires"><?php echo intval(isset($dueliste['nbVictoires']) ? $dueliste['nbVictoires'] : 0); ?></span>
                            /
                            <span class="duel-defaites"><?php echo intval(isset($dueliste['nbDefaites']) ? $dueliste['nbDefaites'] : 0); ?></span>
                        </div>
                        
                        <div class="duel-matches-cell">
                            <span class="duel-matches"><?php echo intval(isset($dueliste['nbMatchsTotal']) ? $dueliste['nbMatchsTotal'] : 0); ?></span>
                        </div>
                        
                        <div class="duel-touches-cell">
                            <span class="duel-touches"><?php echo intval(isset($dueliste['indiceTouches']) ? $dueliste['indiceTouches'] : 0); ?></span>
                        </div>
                        
                        <div class="duel-winrate-cell">
                            <?php 
                            $tauxVictoire = isset($dueliste['tauxVictoire']) ? floatval($dueliste['tauxVictoire']) : 0;
                            // L'API renvoie déjà le taux en pourcentage, pas besoin de multiplier par 100
                            $tauxFormate = round($tauxVictoire, 1);
                            ?>
                            <span class="duel-winrate"><?php echo $tauxFormate; ?>%</span>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>

            <div class="duel-classement-footer">
                <small>Dernière mise à jour : <?php echo date('d/m/Y à H:i'); ?></small>
            </div>
        </div>
        
        <?php
        return ob_get_clean();
        
    } catch (Exception $e) {
        error_log('Erreur shortcode classement: ' . $e->getMessage());
        return '<div class="duel-error">Erreur lors du chargement du classement.</div>';
    }
}

// Enregistrement du shortcode
add_shortcode('duel_classement', 'duel_classement_shortcode');