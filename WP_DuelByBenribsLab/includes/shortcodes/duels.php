<?php
/**
 * Shortcode Duels - Interface complète de gestion des duels
 */

// Empêcher l'accès direct
if (!defined('ABSPATH')) {
    exit;
}

function duel_duels_shortcode($atts) {
    // Vérifier si l'utilisateur est connecté
    if (!isset($_SESSION['duel_token']) || !isset($_SESSION['duel_user'])) {
        return '<div class="duel-error">Vous devez être connecté pour accéder aux duels. <a href="#" onclick="window.location.reload()">Se connecter</a></div>';
    }

    // Vérification de l'existence de la classe
    if (!class_exists('Duel_API_Client')) {
        return '<div class="duel-error">Plugin non initialisé correctement.</div>';
    }

    $api_client = new Duel_API_Client();
    $token = $_SESSION['duel_token'];
    $user = $_SESSION['duel_user'];
    
    // Traitement des actions AJAX
    if (isset($_POST['duel_action'])) {
        return handle_duel_action($api_client, $token, $user);
    }
    
    try {
        // Récupérer les duels de l'utilisateur
        $duels_response = $api_client->get_my_duels($user['id'], $token);
        $duels = isset($duels_response['success']) && $duels_response['success'] ? $duels_response['data'] : array();
        
        // Récupérer tous les duellistes pour le formulaire
        $duellistes_response = $api_client->get_all_duellistes($token);
        $duellistes = isset($duellistes_response['success']) && $duellistes_response['success'] ? $duellistes_response['data'] : array();
        
        // Déterminer l'onglet actif
        $active_tab = isset($_GET['tab']) ? sanitize_text_field($_GET['tab']) : 'invitations-recues';
        $valid_tabs = array('invitations-recues', 'mes-defis', 'duels-actifs', 'duels-recents', 'nouveau-duel');
        if (!in_array($active_tab, $valid_tabs)) {
            $active_tab = 'invitations-recues';
        }
        
        // Calculer les compteurs pour chaque onglet
        $tabs_counts = calculate_tabs_counts($duels, $user['id']);
        
        // Générer le HTML
        ob_start();
        ?>
        <div class="duel-duels-container">
            <!-- Navigation par onglets -->
            <div class="duel-tabs-navigation">
                <div class="duel-tabs-desktop">
                    <?php foreach (get_tabs_config($tabs_counts) as $tab): ?>
                        <a href="?tab=<?php echo esc_attr($tab['id']); ?>" 
                           class="duel-tab <?php echo $active_tab === $tab['id'] ? 'active' : ''; ?>"
                           data-tab="<?php echo esc_attr($tab['id']); ?>">
                            <span class="duel-tab-icon"><?php echo get_tab_icon($tab['id']); ?></span>
                            <span class="duel-tab-label"><?php echo esc_html($tab['label']); ?></span>
                            <?php if ($tab['count'] > 0): ?>
                                <span class="duel-tab-count"><?php echo intval($tab['count']); ?></span>
                            <?php endif; ?>
                        </a>
                    <?php endforeach; ?>
                </div>
            </div>

            <!-- Contenu des onglets -->
            <div class="duel-tab-content">
                <?php 
                switch($active_tab) {
                    case 'invitations-recues':
                        render_invitations_recues($duels, $user['id']);
                        break;
                    case 'mes-defis':
                        render_mes_defis($duels, $user['id']);
                        break;
                    case 'duels-actifs':
                        render_duels_actifs($duels, $user['id']);
                        break;
                    case 'duels-recents':
                        render_duels_recents($duels, $user['id']);
                        break;
                    case 'nouveau-duel':
                        render_nouveau_duel_form($duellistes, $user);
                        break;
                }
                ?>
            </div>
        </div>

        <script>
        // Gestion des actions AJAX pour les duels
        document.addEventListener('DOMContentLoaded', function() {
            // Accepter un duel
            document.querySelectorAll('.duel-accept-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const duelId = this.dataset.duelId;
                    if (confirm('Voulez-vous accepter ce duel ?')) {
                        handleDuelAction('accept', duelId);
                    }
                });
            });

            // Refuser un duel
            document.querySelectorAll('.duel-refuse-btn').forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    const duelId = this.dataset.duelId;
                    if (confirm('Voulez-vous refuser ce duel ?')) {
                        handleDuelAction('refuse', duelId);
                    }
                });
            });

            // Soumettre un score
            const scoreModal = document.getElementById('duel-score-modal');
            if (scoreModal) {
                document.querySelectorAll('.duel-score-btn').forEach(btn => {
                    btn.addEventListener('click', function(e) {
                        e.preventDefault();
                        const duelId = this.dataset.duelId;
                        scoreModal.dataset.duelId = duelId;
                        scoreModal.style.display = 'block';
                    });
                });

                // Fermer la modal
                scoreModal.querySelector('.duel-modal-close').addEventListener('click', function() {
                    scoreModal.style.display = 'none';
                });
            }
        });

        function handleDuelAction(action, duelId) {
            const formData = new FormData();
            formData.append('duel_action', action);
            formData.append('duel_id', duelId);
            formData.append('user_id', <?php echo intval($user['id']); ?>);

            fetch(window.location.href, {
                method: 'POST',
                body: formData
            })
            .then(response => response.text())
            .then(data => {
                window.location.reload();
            })
            .catch(error => {
                console.error('Erreur:', error);
                alert('Une erreur est survenue');
            });
        }
        </script>
        
        <?php
        return ob_get_clean();
        
    } catch (Exception $e) {
        error_log('Erreur shortcode duels: ' . $e->getMessage());
        return '<div class="duel-error">Erreur lors du chargement des duels.</div>';
    }
}

/**
 * Fonctions utilitaires
 */

function calculate_tabs_counts($duels, $user_id) {
    $counts = array(
        'invitations-recues' => 0,
        'mes-defis' => 0,
        'duels-actifs' => 0,
        'duels-recents' => 0
    );
    
    foreach ($duels as $duel) {
        switch ($duel['etat']) {
            case 'PROPOSE':
                if ($duel['adversaire']['id'] == $user_id) {
                    $counts['invitations-recues']++;
                } else if ($duel['provocateur']['id'] == $user_id) {
                    $counts['mes-defis']++;
                }
                break;
            case 'A_JOUER':
                $counts['duels-actifs']++;
                break;
            case 'TERMINE':
                $counts['duels-recents']++;
                break;
        }
    }
    
    return $counts;
}

function get_tabs_config($counts) {
    return array(
        array('id' => 'invitations-recues', 'label' => 'Invitations Reçues', 'count' => $counts['invitations-recues']),
        array('id' => 'mes-defis', 'label' => 'Mes Défis', 'count' => $counts['mes-defis']),
        array('id' => 'duels-actifs', 'label' => 'Duels Actifs', 'count' => $counts['duels-actifs']),
        array('id' => 'duels-recents', 'label' => 'Duels Récents', 'count' => 0),
        array('id' => 'nouveau-duel', 'label' => 'Inviter Quelqu\'un', 'count' => 0)
    );
}

function get_tab_icon($tab_id) {
    $icons = array(
        'invitations-recues' => '📥',
        'mes-defis' => '⚔️',
        'duels-actifs' => '🏃',
        'duels-recents' => '📋',
        'nouveau-duel' => '👤+'
    );
    return isset($icons[$tab_id]) ? $icons[$tab_id] : '•';
}

function render_invitations_recues($duels, $user_id) {
    $invitations = array_filter($duels, function($duel) use ($user_id) {
        return $duel['etat'] === 'PROPOSE' && $duel['adversaire']['id'] == $user_id;
    });
    
    if (empty($invitations)) {
        echo '<div class="duel-empty-state">Aucune invitation reçue</div>';
        return;
    }
    
    echo '<div class="duel-cards-container">';
    foreach ($invitations as $duel) {
        render_duel_card($duel, 'invitation');
    }
    echo '</div>';
}

function render_mes_defis($duels, $user_id) {
    $defis = array_filter($duels, function($duel) use ($user_id) {
        return $duel['etat'] === 'PROPOSE' && $duel['provocateur']['id'] == $user_id;
    });
    
    if (empty($defis)) {
        echo '<div class="duel-empty-state">Aucun défi envoyé</div>';
        return;
    }
    
    echo '<div class="duel-cards-container">';
    foreach ($defis as $duel) {
        render_duel_card($duel, 'defi');
    }
    echo '</div>';
}

function render_duels_actifs($duels, $user_id) {
    $actifs = array_filter($duels, function($duel) {
        return $duel['etat'] === 'A_JOUER';
    });
    
    if (empty($actifs)) {
        echo '<div class="duel-empty-state">Aucun duel actif</div>';
        return;
    }
    
    echo '<div class="duel-cards-container">';
    foreach ($actifs as $duel) {
        render_duel_card($duel, 'actif');
    }
    echo '</div>';
}

function render_duels_recents($duels, $user_id) {
    $recents = array_filter($duels, function($duel) {
        return $duel['etat'] === 'TERMINE';
    });
    
    // Trier par date décroissante
    usort($recents, function($a, $b) {
        return strtotime($b['dateCreation']) - strtotime($a['dateCreation']);
    });
    
    // Limiter aux 20 plus récents
    $recents = array_slice($recents, 0, 20);
    
    if (empty($recents)) {
        echo '<div class="duel-empty-state">Aucun duel récent</div>';
        return;
    }
    
    echo '<div class="duel-cards-container">';
    foreach ($recents as $duel) {
        render_duel_card($duel, 'recent');
    }
    echo '</div>';
}

function render_duel_card($duel, $type) {
    $date_creation = date('d/m/Y à H:i', strtotime($duel['dateCreation']));
    ?>
    <div class="duel-card duel-card-<?php echo esc_attr($type); ?>">
        <div class="duel-card-header">
            <div class="duel-participants">
                <span class="duel-participant">
                    <?php echo esc_html($duel['provocateur']['pseudo']); ?>
                </span>
                <span class="duel-vs">VS</span>
                <span class="duel-participant">
                    <?php echo esc_html($duel['adversaire']['pseudo']); ?>
                </span>
            </div>
            <div class="duel-date"><?php echo esc_html($date_creation); ?></div>
        </div>
        
        <?php if (!empty($duel['notes'])): ?>
            <div class="duel-notes">
                <strong>Message :</strong> <?php echo esc_html($duel['notes']); ?>
            </div>
        <?php endif; ?>
        
        <?php if (!empty($duel['dateProgrammee'])): ?>
            <div class="duel-date-programmee">
                <strong>Date souhaitée :</strong> <?php echo esc_html(date('d/m/Y à H:i', strtotime($duel['dateProgrammee']))); ?>
            </div>
        <?php endif; ?>
        
        <div class="duel-card-actions">
            <?php if ($type === 'invitation'): ?>
                <button class="duel-btn duel-btn-success duel-accept-btn" data-duel-id="<?php echo intval($duel['id']); ?>">
                    ✓ Accepter
                </button>
                <button class="duel-btn duel-btn-danger duel-refuse-btn" data-duel-id="<?php echo intval($duel['id']); ?>">
                    ✗ Refuser
                </button>
            <?php elseif ($type === 'actif'): ?>
                <button class="duel-btn duel-btn-primary duel-score-btn" data-duel-id="<?php echo intval($duel['id']); ?>">
                    📊 Saisir le score
                </button>
            <?php elseif ($type === 'recent'): ?>
                <div class="duel-result">
                    <?php if (isset($duel['scoreProvo']) && isset($duel['scoreAdv'])): ?>
                        Score : <?php echo intval($duel['scoreProvo']); ?> - <?php echo intval($duel['scoreAdv']); ?>
                    <?php else: ?>
                        Score non disponible
                    <?php endif; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
    <?php
}

function render_nouveau_duel_form($duellistes, $user) {
    ?>
    <div class="duel-nouveau-form">
        <h3>Inviter quelqu'un à un duel</h3>
        <p class="duel-form-description">Choisissez votre adversaire et lancez votre défi !</p>
        
        <form method="post" class="duel-form">
            <input type="hidden" name="duel_action" value="create">
            
            <div class="duel-form-group">
                <label for="adversaire">Adversaire *</label>
                <select name="adversaire_id" id="adversaire" required class="duel-form-control">
                    <option value="">Choisir un adversaire...</option>
                    <?php foreach ($duellistes as $dueliste): ?>
                        <?php if ($dueliste['id'] != $user['id']): ?>
                            <option value="<?php echo intval($dueliste['id']); ?>">
                                <?php echo esc_html($dueliste['pseudo']); ?>
                                <?php if (!empty($dueliste['categorie']) && strtolower($dueliste['categorie']) === 'junior'): ?>
                                    (Junior)
                                <?php endif; ?>
                            </option>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="duel-form-group">
                <label for="notes">Message (optionnel)</label>
                <textarea name="notes" id="notes" rows="3" placeholder="Ajouter un message avec votre défi..." class="duel-form-control"></textarea>
            </div>
            
            <div class="duel-form-group">
                <label for="date_programmee">Date souhaitée (optionnel)</label>
                <input type="datetime-local" name="date_programmee" id="date_programmee" class="duel-form-control">
            </div>
            
            <div class="duel-form-actions">
                <button type="submit" class="duel-btn duel-btn-primary">
                    🎯 Envoyer l'invitation
                </button>
            </div>
        </form>
    </div>
    <?php
}

function handle_duel_action($api_client, $token, $user) {
    $action = sanitize_text_field($_POST['duel_action']);
    
    switch ($action) {
        case 'accept':
            $duel_id = intval($_POST['duel_id']);
            $response = $api_client->accept_duel($duel_id, array('adversaireId' => $user['id']), $token);
            break;
            
        case 'refuse':
            $duel_id = intval($_POST['duel_id']);
            $response = $api_client->refuse_duel($duel_id, array('adversaireId' => $user['id']), $token);
            break;
            
        case 'create':
            $duel_data = array(
                'provocateurId' => $user['id'],
                'adversaireId' => intval($_POST['adversaire_id'])
            );
            
            if (!empty($_POST['notes'])) {
                $duel_data['notes'] = sanitize_textarea_field($_POST['notes']);
            }
            
            if (!empty($_POST['date_programmee'])) {
                $duel_data['dateProgrammee'] = sanitize_text_field($_POST['date_programmee']);
            }
            
            $response = $api_client->create_duel($duel_data, $token);
            break;
            
        default:
            return '<div class="duel-error">Action non reconnue</div>';
    }
    
    if (isset($response['success']) && $response['success']) {
        echo '<script>window.location.reload();</script>';
        return '<div class="duel-success">Action effectuée avec succès</div>';
    } else {
        $error = isset($response['error']) ? $response['error'] : 'Erreur inconnue';
        return '<div class="duel-error">Erreur : ' . esc_html($error) . '</div>';
    }
}

// Enregistrement du shortcode
add_shortcode('duel_duels', 'duel_duels_shortcode');