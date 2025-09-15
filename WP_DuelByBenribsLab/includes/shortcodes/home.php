<?php
/**
 * Shortcode de page d'accueil [duel_home]
 */

if (!defined('ABSPATH')) {
    exit;
}

class Duel_Home_Shortcode {
    
    /**
     * Rendre le shortcode de page d'accueil
     * 
     * @param array $atts Attributs du shortcode
     * @return string HTML de la page d'accueil
     */
    public static function render($atts = array()) {
        // Attributs par défaut
        $atts = shortcode_atts(array(
            'register_url' => 'https://escrime-cey.fr/inscription-duel-by-benribs-lab/',
            'login_url' => 'https://escrime-cey.fr/connexion-duel-by-benribs-lab/',
            'logo_url' => DUEL_PLUGIN_URL . 'assets/logo_cey_noir.png'
        ), $atts);
        
        // Générer le HTML
        ob_start();
        ?>
        <div class="duel-home-container">
            <!-- Hero Section -->
            <section class="duel-hero">
                <div class="duel-hero-content">                    
                    <h1 class="duel-hero-title">
                        L'arène des <span class="duel-gradient-text">duellistes</span>
                    </h1>
                    <p class="duel-hero-description">
                        Défiez vos adversaires, grimpez dans les classements et devenez le champion ultime. 
                        Un système de points équitable qui récompense la participation et la performance.
                    </p>
                    <div class="duel-hero-buttons">
                        <a href="<?php echo esc_url($atts['register_url']); ?>" class="duel-btn duel-btn-primary duel-btn-large">
                            Commencer l'aventure →
                        </a>
                        <a href="<?php echo esc_url($atts['login_url']); ?>" class="duel-btn duel-btn-secondary duel-btn-large">
                            J'ai déjà un compte
                        </a>
                    </div>
                </div>
            </section>

            <!-- Comment ça marche -->
            <section class="duel-how-it-works">
                <div class="duel-section-header">
                    <h2>Comment ça marche ?</h2>
                    <p>Quatre étapes simples pour devenir un champion</p>
                </div>

                <div class="duel-steps-grid">
                    <!-- Étape 1 -->
                    <div class="duel-step">
                        <div class="duel-step-icon duel-step-icon-purple">
                            👥
                        </div>
                        <h3>1. Créez votre profil</h3>
                        <p>Inscrivez-vous et choisissez votre catégorie (Junior ou Adulte)</p>
                    </div>

                    <!-- Étape 2 -->
                    <div class="duel-step">
                        <div class="duel-step-icon duel-step-icon-blue">
                            🎯
                        </div>
                        <h3>2. Lancez des défis</h3>
                        <p>Proposez des duels à la salle ou acceptez leurs invitations</p>
                    </div>

                    <!-- Étape 3 -->
                    <div class="duel-step">
                        <div class="duel-step-icon duel-step-icon-green">
                            ⚔️
                        </div>
                        <h3>3. Battez-vous</h3>
                        <p>Affrontez vos adversaires et enregistrez les résultats de vos duels</p>
                    </div>

                    <!-- Étape 4 -->
                    <div class="duel-step">
                        <div class="duel-step-icon duel-step-icon-yellow">
                            🏆
                        </div>
                        <h3>4. Grimpez au classement</h3>
                        <p>Gagnez des points et montez dans le ranking de votre catégorie</p>
                    </div>
                </div>
            </section>

            <!-- Système de points -->
            <section class="duel-points-system">
                <div class="duel-section-header duel-section-header-white">
                    <h2>Système de points équitable</h2>
                    <p>Le système récompense à la fois la performance et la participation</p>
                </div>

                <div class="duel-points-content">
                    <div class="duel-points-rules">
                        <div class="duel-point-rule">
                            <div class="duel-point-icon duel-point-icon-gold">
                                🏆
                            </div>
                            <div class="duel-point-text">
                                <h3>3 points pour une victoire</h3>
                                <p>Récompense la performance et l'excellence</p>
                            </div>
                        </div>

                        <div class="duel-point-rule">
                            <div class="duel-point-icon duel-point-icon-blue">
                                ⭐
                            </div>
                            <div class="duel-point-text">
                                <h3>1 point pour une défaite</h3>
                                <p>Encourage la participation et l'apprentissage</p>
                            </div>
                        </div>

                        <div class="duel-point-rule">
                            <div class="duel-point-icon duel-point-icon-green">
                                ⚡
                            </div>
                            <div class="duel-point-text">
                                <h3>Indice de touches</h3>
                                <p>L'indice pour départager les égalités</p>
                            </div>
                        </div>
                    </div>

                    <div class="duel-points-benefits">
                        <h3>Pourquoi ce système ?</h3>
                        <ul>
                            <li>✅ Dynamiser les relations entre les adhérents</li>
                            <li>✅ Système de compétitions locales</li>
                            <li>✅ Classements séparés Enfants et Adultes pour plus d'équité</li>
                            <li>✅ Progression visible et motivante pour tous les niveaux</li>
                        </ul>
                    </div>
                </div>
            </section>

            <!-- Catégories -->
            <section class="duel-categories">
                <div class="duel-section-header">
                    <h2>Deux catégories, deux classements</h2>
                    <p>Une compétition équitable adaptée à chaque tranche d'âge</p>
                </div>

                <div class="duel-categories-grid">
                    <!-- Catégorie Junior -->
                    <div class="duel-category-card">
                        <div class="duel-category-icon duel-category-icon-orange">
                            🥉
                        </div>
                        <h3>Catégorie Junior</h3>
                        <p class="duel-category-age">Pour les duellistes de <strong>moins de 15 ans</strong></p>
                        <ul class="duel-category-features">
                            <li>✅ Classement dédié</li>
                            <li>✅ Même système de points</li>
                            <li>✅ Compétition équitable</li>
                        </ul>
                    </div>

                    <!-- Catégorie Senior -->
                    <div class="duel-category-card">
                        <div class="duel-category-icon duel-category-icon-purple">
                            🏆
                        </div>
                        <h3>Catégorie Senior</h3>
                        <p class="duel-category-age">Pour les duellistes de <strong>15 ans et plus</strong></p>
                        <ul class="duel-category-features">
                            <li>✅ Classement général</li>
                            <li>✅ Même système de points</li>
                            <li>✅ Compétition expérimentée</li>
                        </ul>
                    </div>
                </div>
            </section>

            <!-- CTA Final -->
            <section class="duel-final-cta">
                <div class="duel-final-cta-content">
                    <h2>Prêt à rejoindre l'arène ?</h2>
                    <p>Créez votre compte maintenant et commencez votre ascension vers le sommet du classement !</p>
                    <div class="duel-final-cta-buttons">
                        <a href="<?php echo esc_url($atts['register_url']); ?>" class="duel-btn duel-btn-primary duel-btn-large">
                            Créer mon compte →
                        </a>
                        <a href="<?php echo esc_url($atts['login_url']); ?>" class="duel-btn duel-btn-link">
                            J'ai déjà un compte
                        </a>
                    </div>
                </div>
            </section>

            <!-- Footer -->
            <footer class="duel-footer">
                <div class="duel-footer-content">
                    <div class="duel-footer-logo">
                        <span class="duel-footer-title">⚔️ Duel By Benribs Lab</span>
                    </div>
                    <p class="duel-footer-tagline">
                        L'arène ultime des duellistes. Que le meilleur gagne !
                    </p>
                </div>
            </footer>
        </div>
        <?php
        return ob_get_clean();
    }
}