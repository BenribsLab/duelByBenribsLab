import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

/**
 * Hook pour gérer le bouton retour Android de manière intelligente
 * @param {Object} options - Options de configuration
 * @param {Function} options.onBack - Fonction personnalisée à exécuter au retour (optionnelle)
 * @param {string} options.fallbackRoute - Route par défaut si pas d'historique (défaut: '/')
 * @param {boolean} options.preventExit - Empêcher la sortie de l'app sur la route d'accueil (défaut: false)
 */
const useBackButton = (options = {}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    onBack,
    fallbackRoute = '/',
    preventExit = false
  } = options;

  useEffect(() => {
    // Ne s'exécuter que sur les plateformes natives (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleBackButton = () => {
      // Si une fonction personnalisée est définie, l'utiliser
      if (onBack) {
        onBack();
        return;
      }

      // Logique par défaut selon la route actuelle
      const currentPath = location.pathname;

      // Si on est sur la page d'accueil
      if (currentPath === '/' || currentPath === '/dashboard') {
        if (preventExit) {
          // Ne pas quitter l'app, rester sur la page
          return;
        } else {
          // Demander confirmation avant de quitter l'app
          const confirmExit = window.confirm('Voulez-vous vraiment quitter l\'application ?');
          if (confirmExit) {
            App.exitApp();
          }
          return;
        }
      }

      // Pour les autres pages, essayer de naviguer intelligemment
      if (window.history.length > 1) {
        // Il y a un historique, revenir en arrière
        navigate(-1);
      } else {
        // Pas d'historique, aller à la route de fallback
        navigate(fallbackRoute);
      }
    };

    // Écouter l'événement backButton de Capacitor
    const backButtonListener = App.addListener('backButton', handleBackButton);

    // Cleanup lors du démontage du composant
    return () => {
      backButtonListener.remove();
    };
  }, [navigate, location.pathname, onBack, fallbackRoute, preventExit]);
};

export default useBackButton;