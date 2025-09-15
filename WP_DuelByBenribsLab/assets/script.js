/**
 * JavaScript pour les shortcodes Duel by Benribs Lab
 */

jQuery(document).ready(function($) {
    
    // Amélioration UX pour le champ OTP
    $('.duel-otp-input').on('input', function() {
        var value = $(this).val().replace(/\D/g, ''); // Garde seulement les chiffres
        $(this).val(value);
        
        // Auto-submit quand 6 chiffres sont saisis
        if (value.length === 6) {
            $(this).closest('form').submit();
        }
    });
    
    // Formatage en temps réel du champ OTP
    $('.duel-otp-input').on('keydown', function(e) {
        // Permettre: backspace, delete, tab, escape, enter
        if ($.inArray(e.keyCode, [46, 8, 9, 27, 13]) !== -1 ||
            // Permettre Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            (e.keyCode === 65 && e.ctrlKey === true) ||
            (e.keyCode === 67 && e.ctrlKey === true) ||
            (e.keyCode === 86 && e.ctrlKey === true) ||
            (e.keyCode === 88 && e.ctrlKey === true)) {
            return;
        }
        // S'assurer que c'est un chiffre et arrêter le keypress si ce n'est pas le cas
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });
    
    // Validation en temps réel des formulaires
    $('.duel-form-control').on('blur', function() {
        var $field = $(this);
        var value = $field.val().trim();
        
        // Validation email
        if ($field.attr('type') === 'email' && value) {
            var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                $field.addClass('duel-field-error');
            } else {
                $field.removeClass('duel-field-error');
            }
        }
        
        // Validation pseudo (sans @)
        if ($field.attr('name') === 'identifier' && value) {
            if (value.includes('@')) {
                // C'est un email, vérifier le format
                var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    $field.addClass('duel-field-error');
                } else {
                    $field.removeClass('duel-field-error');
                }
            } else {
                // C'est un pseudo, vérifier la longueur
                if (value.length < 2) {
                    $field.addClass('duel-field-error');
                } else {
                    $field.removeClass('duel-field-error');
                }
            }
        }
    });
    
    // Indicateur de chargement pour les formulaires
    $('.duel-login-form form, .duel-register-form form').on('submit', function() {
        var $form = $(this);
        var $submitBtn = $form.find('button[type="submit"]');
        
        $submitBtn.prop('disabled', true);
        $submitBtn.html('<span class="duel-spinner"></span> ' + $submitBtn.text());
        
        // Simuler un léger délai pour montrer le spinner
        setTimeout(function() {
            // Le formulaire sera soumis naturellement
        }, 100);
    });
    
    // Gestion des liens d'inscription dynamiques
    $(document).on('click', '.duel-register-link', function(e) {
        e.preventDefault();
        
        // Si on est sur une page avec le shortcode register, scroller vers lui
        var $registerForm = $('.duel-register-container');
        if ($registerForm.length) {
            $('html, body').animate({
                scrollTop: $registerForm.offset().top - 50
            }, 500);
        } else {
            // Sinon, rediriger ou afficher un message
            alert('Veuillez vous rendre sur la page d\'inscription');
        }
    });
    
    // Auto-focus sur le premier champ visible
    setTimeout(function() {
        $('.duel-form-control:visible:first').focus();
    }, 100);
    
    // Gestion du responsive pour les stats
    function adjustStatsLayout() {
        var $statsContainer = $('.duel-profile-stats');
        if ($(window).width() < 480) {
            $statsContainer.addClass('duel-mobile-stats');
        } else {
            $statsContainer.removeClass('duel-mobile-stats');
        }
    }
    
    $(window).on('resize', adjustStatsLayout);
    adjustStatsLayout();
    
});

// Fonction utilitaire pour valider les emails
function isDuelValidEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}