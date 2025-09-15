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
        return '<div class="duel-error">Vous devez être connecté pour accéder aux duels. <a href="https://escrime-cey.fr/connexion-duel-by-benribs-lab/" onclick="window.location.reload()">Se connecter</a></div>';
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
                        render_duels_actifs($duels, $user['id'], $api_client, $token);
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

        <!-- Modal de saisie de score -->
        <div id="duel-score-modal" class="duel-modal" style="display: none;">
            <div class="duel-modal-content">
                <div class="duel-modal-header">
                    <h3>Saisir le score du duel</h3>
                    <span class="duel-modal-close">&times;</span>
                </div>
                <form method="post" class="duel-modal-form">
                    <input type="hidden" name="duel_action" value="score">
                    <input type="hidden" name="duel_id" id="modal-duel-id">
                    <?php wp_nonce_field('duel_score_action', 'duel_score_nonce'); ?>
                    
                    <div class="duel-form-group">
                        <label id="mon-score-label">Mon score</label>
                        <input type="number" name="mon_score" min="0" max="99" required class="duel-form-control">
                    </div>
                    
                    <div class="duel-form-group">
                        <label id="score-adversaire-label">Score adversaire</label>
                        <input type="number" name="score_adversaire" min="0" max="99" required class="duel-form-control">
                    </div>
                    
                    <div class="duel-modal-actions">
                        <button type="button" class="duel-btn duel-btn-secondary duel-modal-close">Annuler</button>
                        <button type="submit" class="duel-btn duel-btn-primary">Valider le score</button>
                    </div>
                </form>
            </div>
        </div>

        <script>
        // Gestion des actions AJAX pour les duels
        function attachDuelEventListeners() {
            // Accepter un duel
            document.querySelectorAll('.duel-accept-btn').forEach(btn => {
                btn.removeEventListener('click', handleAcceptClick); // Éviter les doubles gestionnaires
                btn.addEventListener('click', handleAcceptClick);
            });

            // Refuser un duel
            document.querySelectorAll('.duel-refuse-btn').forEach(btn => {
                btn.removeEventListener('click', handleRefuseClick);
                btn.addEventListener('click', handleRefuseClick);
            });

            // Accepter une proposition de score
            document.querySelectorAll('.duel-accept-proposition-btn').forEach(btn => {
                btn.removeEventListener('click', handleAcceptPropositionClick);
                btn.addEventListener('click', handleAcceptPropositionClick);
            });

            // Soumettre un score
            document.querySelectorAll('.duel-score-btn').forEach(btn => {
                btn.removeEventListener('click', handleScoreClick);
                btn.addEventListener('click', handleScoreClick);
            });
        }

        function handleAcceptClick(e) {
            e.preventDefault();
            const duelId = this.dataset.duelId;
            if (confirm('Voulez-vous accepter ce duel ?')) {
                handleDuelAction('accept', duelId);
            }
        }

        function handleRefuseClick(e) {
            e.preventDefault();
            const duelId = this.dataset.duelId;
            if (confirm('Voulez-vous refuser ce duel ?')) {
                handleDuelAction('refuse', duelId);
            }
        }

        function handleAcceptPropositionClick(e) {
            e.preventDefault();
            const duelId = this.dataset.duelId;
            if (confirm('Voulez-vous confirmer cette proposition de score ?')) {
                handleDuelAction('accept_proposition', duelId);
            }
        }

        function handleScoreClick(e) {
            e.preventDefault();
            const duelId = this.dataset.duelId;
            const provocateurPseudo = this.dataset.provocateurPseudo;
            const adversairePseudo = this.dataset.adversairePseudo;
            const currentUserId = parseInt(this.dataset.currentUserId);
            const provocateurId = parseInt(this.dataset.provocateurId);
            
            const scoreModal = document.getElementById('duel-score-modal');
            const modalDuelId = document.getElementById('modal-duel-id');
            const monScoreLabel = document.getElementById('mon-score-label');
            const scoreAdversaireLabel = document.getElementById('score-adversaire-label');
            
            if (scoreModal && modalDuelId && monScoreLabel && scoreAdversaireLabel) {
                modalDuelId.value = duelId;
                
                // Déterminer qui est qui selon l'utilisateur connecté
                const isProvocateur = (currentUserId === provocateurId);
                const monPseudo = isProvocateur ? provocateurPseudo : adversairePseudo;
                const adversairePseudoDisplay = isProvocateur ? adversairePseudo : provocateurPseudo;
                
                // Mettre à jour les labels avec les pseudos
                monScoreLabel.textContent = `Score de ${monPseudo}`;
                scoreAdversaireLabel.textContent = `Score de ${adversairePseudoDisplay}`;
                
                scoreModal.style.display = 'block';
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            // Attacher les gestionnaires au chargement initial
            attachDuelEventListeners();

            // Fermer la modal
            const scoreModal = document.getElementById('duel-score-modal');
            if (scoreModal) {
                scoreModal.querySelectorAll('.duel-modal-close').forEach(closeBtn => {
                    closeBtn.addEventListener('click', function() {
                        scoreModal.style.display = 'none';
                    });
                });
                
                // Fermer en cliquant en dehors de la modal
                scoreModal.addEventListener('click', function(e) {
                    if (e.target === scoreModal) {
                        scoreModal.style.display = 'none';
                    }
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
        
        </div>
        
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
            case 'PROPOSE_SCORE':
                $counts['duels-actifs']++;
                break;
            case 'VALIDE':
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
        array('id' => 'duels-recents', 'label' => 'Duels Récents', 'count' => $counts['duels-recents']),
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

function render_duels_actifs($duels, $user_id, $api_client, $token) {
    $actifs = array_filter($duels, function($duel) {
        return $duel['etat'] === 'A_JOUER' || $duel['etat'] === 'PROPOSE_SCORE';
    });
    
    if (empty($actifs)) {
        echo '<div class="duel-empty-state">Aucun duel actif</div>';
        return;
    }
    
    echo '<div class="duel-cards-container">';
    foreach ($actifs as $duel) {
        render_duel_card($duel, 'actif', $user_id, $api_client, $token);
    }
    echo '</div>';
}

function render_duels_recents($duels, $user_id) {
    $recents = array_filter($duels, function($duel) {
        return $duel['etat'] === 'VALIDE';
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

function render_duel_card($duel, $type, $user_id = null, $api_client = null, $token = null) {
    // Gérer le format de date ISO (ex: "2025-09-15T14:30:00.000Z")
    $date_creation = 'Date non disponible';
    if (!empty($duel['dateCreation'])) {
        $timestamp = strtotime($duel['dateCreation']);
        if ($timestamp !== false) {
            $date_creation = date('d/m/Y à H:i', $timestamp);
        }
    }
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
                <?php if ($duel['etat'] === 'PROPOSE_SCORE'): ?>
                    <?php
                    // Récupérer les informations de la proposition via l'API
                    $proposition = null;
                    if ($user_id && $api_client && $token) {
                        $proposition_response = $api_client->get_proposition_score($duel['id'], $user_id, $token);
                        if (isset($proposition_response['success']) && $proposition_response['success']) {
                            $proposition = $proposition_response['data'];
                        }
                    }
                    
                    if ($proposition): ?>
                        <?php if ($proposition['aPropose']): ?>
                            <!-- L'utilisateur a proposé un score -->
                            <div class="duel-proposition-status">
                                <p><strong>✉️ Votre proposition de score :</strong></p>
                                <p><?php echo esc_html($proposition['provocateur']['pseudo']); ?> : <?php echo intval($proposition['scoreProvocateur']); ?> - <?php echo esc_html($proposition['adversaire']['pseudo']); ?> : <?php echo intval($proposition['scoreAdversaire']); ?></p>
                                <p class="duel-waiting">⏳ En attente de validation par votre adversaire</p>
                            </div>
                        <?php else: ?>
                            <!-- L'adversaire a proposé un score -->
                            <div class="duel-proposition-status">
                                <p><strong>📩 Proposition de <?php echo esc_html($proposition['proposePar']['pseudo']); ?> :</strong></p>
                                <p><?php echo esc_html($proposition['provocateur']['pseudo']); ?> : <?php echo intval($proposition['scoreProvocateur']); ?> - <?php echo esc_html($proposition['adversaire']['pseudo']); ?> : <?php echo intval($proposition['scoreAdversaire']); ?></p>
                                <div class="duel-proposition-actions">
                                    <button class="duel-btn duel-btn-success duel-accept-proposition-btn" data-duel-id="<?php echo intval($duel['id']); ?>">
                                        ✓ Confirmer
                                    </button>
                                    <button class="duel-btn duel-btn-primary duel-score-btn" 
                                            data-duel-id="<?php echo intval($duel['id']); ?>"
                                            data-provocateur-pseudo="<?php echo esc_attr($duel['provocateur']['pseudo']); ?>"
                                            data-adversaire-pseudo="<?php echo esc_attr($duel['adversaire']['pseudo']); ?>"
                                            data-current-user-id="<?php echo intval($user_id); ?>"
                                            data-provocateur-id="<?php echo intval($duel['provocateurId']); ?>">
                                        📝 Modifier
                                    </button>
                                </div>
                            </div>
                        <?php endif; ?>
                    <?php else: ?>
                        <!-- Fallback si impossible de récupérer la proposition -->
                        <div class="duel-proposition-status">
                            <p><strong>⚠️ Proposition de score en cours</strong></p>
                            <p>Scores : <?php echo intval($duel['scoreProvocateur'] ?? 0); ?> - <?php echo intval($duel['scoreAdversaire'] ?? 0); ?></p>
                            <div class="duel-proposition-actions">
                                <button class="duel-btn duel-btn-success duel-accept-proposition-btn" data-duel-id="<?php echo intval($duel['id']); ?>">
                                    ✓ Confirmer
                                </button>
                                <button class="duel-btn duel-btn-primary duel-score-btn" 
                                        data-duel-id="<?php echo intval($duel['id']); ?>"
                                        data-provocateur-pseudo="<?php echo esc_attr($duel['provocateur']['pseudo']); ?>"
                                        data-adversaire-pseudo="<?php echo esc_attr($duel['adversaire']['pseudo']); ?>"
                                        data-current-user-id="<?php echo intval($user_id); ?>"
                                        data-provocateur-id="<?php echo intval($duel['provocateurId']); ?>">
                                    📝 Modifier
                                </button>
                            </div>
                        </div>
                    <?php endif; ?>
                <?php else: ?>
                    <!-- Duel normal A_JOUER -->
                    <button class="duel-btn duel-btn-primary duel-score-btn" 
                            data-duel-id="<?php echo intval($duel['id']); ?>"
                            data-provocateur-pseudo="<?php echo esc_attr($duel['provocateur']['pseudo']); ?>"
                            data-adversaire-pseudo="<?php echo esc_attr($duel['adversaire']['pseudo']); ?>"
                            data-current-user-id="<?php echo intval($user_id); ?>"
                            data-provocateur-id="<?php echo intval($duel['provocateurId']); ?>">
                        📊 Saisir le score
                    </button>
                <?php endif; ?>
            <?php elseif ($type === 'recent'): ?>
                <div class="duel-result">
                    <?php if (isset($duel['scoreProvocateur']) && isset($duel['scoreAdversaire'])): ?>
                        Score : <?php echo intval($duel['scoreProvocateur']); ?> - <?php echo intval($duel['scoreAdversaire']); ?>
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
        
        <form method="post" class="duel-form" id="duel-form-nouveau">
            <input type="hidden" name="duel_action" value="create">
            <?php wp_nonce_field('duel_create_action', 'duel_nonce'); ?>
            
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
                <button type="submit" class="duel-btn duel-btn-primary" id="submit-btn">
                    🎯 Envoyer l'invitation
                </button>
            </div>
        </form>
        
        <script>
        // Protection contre les doubles soumissions
        document.getElementById('duel-form-nouveau').addEventListener('submit', function(e) {
            const submitBtn = document.getElementById('submit-btn');
            if (submitBtn.disabled) {
                e.preventDefault();
                return false;
            }
            
            // Désactiver le bouton et changer le texte
            submitBtn.disabled = true;
            submitBtn.innerHTML = '⏳ Envoi en cours...';
            
            // Réactiver après 5 secondes en cas de problème
            setTimeout(function() {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '🎯 Envoyer l\'invitation';
            }, 5000);
        });
        </script>
    </div>
    <?php
}

function handle_duel_action($api_client, $token, $user) {
    $action = sanitize_text_field($_POST['duel_action']);
    
    // Vérification du nonce pour les actions de création et score
    if ($action === 'create') {
        if (!isset($_POST['duel_nonce']) || !wp_verify_nonce($_POST['duel_nonce'], 'duel_create_action')) {
            return '<div class="duel-error">Erreur de sécurité. Veuillez recharger la page.</div>';
        }
    } elseif ($action === 'score') {
        if (!isset($_POST['duel_score_nonce']) || !wp_verify_nonce($_POST['duel_score_nonce'], 'duel_score_action')) {
            return '<div class="duel-error">Erreur de sécurité. Veuillez recharger la page.</div>';
        }
    }
    
    switch ($action) {
        case 'accept':
            $duel_id = intval($_POST['duel_id']);
            $response = $api_client->accept_duel($duel_id, array('adversaireId' => $user['id']), $token);
            break;
            
        case 'refuse':
            $duel_id = intval($_POST['duel_id']);
            $response = $api_client->refuse_duel($duel_id, array('adversaireId' => $user['id']), $token);
            break;
            
        case 'score':
            // Validation des données de score
            if (empty($_POST['duel_id']) || !is_numeric($_POST['duel_id'])) {
                return '<div class="duel-error">ID de duel invalide.</div>';
            }
            if (!isset($_POST['mon_score']) || !is_numeric($_POST['mon_score'])) {
                return '<div class="duel-error">Score invalide.</div>';
            }
            if (!isset($_POST['score_adversaire']) || !is_numeric($_POST['score_adversaire'])) {
                return '<div class="duel-error">Score adversaire invalide.</div>';
            }
            
            $duel_id = intval($_POST['duel_id']);
            $mon_score = intval($_POST['mon_score']);
            $score_adversaire = intval($_POST['score_adversaire']);
            
            // Récupérer les informations du duel pour déterminer qui est le provocateur
            $duel_response = $api_client->get_duel_by_id($duel_id, $token);
            if (!isset($duel_response['success']) || !$duel_response['success']) {
                return '<div class="duel-error">Impossible de récupérer les informations du duel.</div>';
            }
            
            $duel = $duel_response['data'];
            $is_provocateur = ($duel['provocateurId'] == $user['id']);
            
            // Construire les données selon les attentes de l'API
            $score_data = array(
                'duelisteId' => $user['id'],
                'scoreProvocateur' => $is_provocateur ? $mon_score : $score_adversaire,
                'scoreAdversaire' => $is_provocateur ? $score_adversaire : $mon_score
            );
            
            $response = $api_client->validate_score($duel_id, $score_data, $token);
            break;
            
        case 'accept_proposition':
            // Accepter une proposition de score existante
            if (empty($_POST['duel_id']) || !is_numeric($_POST['duel_id'])) {
                return '<div class="duel-error">ID de duel invalide.</div>';
            }
            
            $duel_id = intval($_POST['duel_id']);
            $response = $api_client->accept_proposition_score($duel_id, $user['id'], $token);
            break;
            
        case 'create':
            // Validation des données
            if (empty($_POST['adversaire_id']) || !is_numeric($_POST['adversaire_id'])) {
                return '<div class="duel-error">Veuillez sélectionner un adversaire valide.</div>';
            }
            
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
        // Redirection pour éviter la re-soumission
        $current_url = remove_query_arg('duel_action');
        
        // Choisir l'onglet selon l'action
        if ($action === 'accept_proposition' || $action === 'score') {
            // Pour les scores, rediriger vers duels récents si le duel est terminé
            $current_url = add_query_arg('tab', 'duels-recents', $current_url);
        } else {
            // Pour les autres actions, rester sur mes défis
            $current_url = add_query_arg('tab', 'mes-defis', $current_url);
        }
        
        wp_redirect($current_url);
        exit;
    } else {
        $error = isset($response['error']) ? $response['error'] : 'Erreur inconnue';
        return '<div class="duel-error">Erreur : ' . esc_html($error) . '</div>';
    }
}

// Enregistrement du shortcode
add_shortcode('duel_duels', 'duel_duels_shortcode');