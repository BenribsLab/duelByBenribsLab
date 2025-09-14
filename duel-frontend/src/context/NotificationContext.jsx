import { createContext, useContext, useState, useEffect } from 'react';
import { duelsService } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { user } = useAuth();

  // Fonction pour charger les notifications
  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      const response = await duelsService.getMyDuels(user.id);
      const duels = response.data.data;
      
      const newNotifications = [];

      // Notifications pour les nouvelles invitations reçues
      const invitationsRecues = duels.filter(d => 
        d.etat === 'PROPOSE' && 
        d.adversaire.id === user.id
      );

      invitationsRecues.forEach(duel => {
        newNotifications.push({
          id: `invitation-${duel.id}`,
          type: 'invitation',
          title: 'Nouveau défi reçu',
          message: `${duel.provocateur.pseudo} vous a défié !`,
          link: '/app/duels?tab=invitations-recues',
          data: duel,
          timestamp: new Date(duel.dateCreation)
        });
      });

      // Notifications pour les duels acceptés (mes défis acceptés)
      const defisAcceptes = duels.filter(d => 
        d.etat === 'A_JOUER' && 
        d.provocateur.id === user.id &&
        // Vérifier si c'est récent (moins de 24h)
        new Date() - new Date(d.dateAcceptation) < 24 * 60 * 60 * 1000
      );

      defisAcceptes.forEach(duel => {
        newNotifications.push({
          id: `accepted-${duel.id}`,
          type: 'accepted',
          title: 'Défi accepté',
          message: `${duel.adversaire.pseudo} a accepté votre défi !`,
          link: '/app/duels?tab=duels-actifs',
          data: duel,
          timestamp: new Date(duel.dateAcceptation)
        });
      });

      // Notifications pour les propositions de score
      const propositionsScore = duels.filter(d => 
        d.etat === 'PROPOSE_SCORE' &&
        (d.provocateur.id === user.id || d.adversaire.id === user.id)
      );

      // Pour chaque proposition de score, on doit déterminer qui a proposé
      for (const duel of propositionsScore) {
        try {
          // Récupérer les validations pour voir qui a proposé en premier
          const validationsResponse = await duelsService.getById(duel.id);
          const duelDetaille = validationsResponse.data.data;
          
          if (duelDetaille.validations && duelDetaille.validations.length > 0) {
            const premierValidation = duelDetaille.validations[0];
            const proposeur = premierValidation.dueliste;
            
            // Afficher la notification seulement si ce n'est pas moi qui ai proposé
            if (proposeur.id !== user.id) {
              newNotifications.push({
                id: `score-${duel.id}`,
                type: 'score',
                title: 'Proposition de score',
                message: `${proposeur.pseudo} a proposé un score : ${duel.scoreProvocateur}-${duel.scoreAdversaire}`,
                link: '/app/duels?tab=duels-actifs',
                data: duel,
                timestamp: new Date(premierValidation.dateSaisie)
              });
            }
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des détails du duel:', error);
        }
      }

      // Notifications pour les duels terminés (score accepté) - récents (moins de 24h)
      const duelsTermines = duels.filter(d => 
        d.etat === 'VALIDE' &&
        (d.provocateur.id === user.id || d.adversaire.id === user.id) &&
        d.dateValidation &&
        // Vérifier si c'est récent (moins de 24h)
        new Date() - new Date(d.dateValidation) < 24 * 60 * 60 * 1000
      );

      duelsTermines.forEach(duel => {
        const adversaire = duel.provocateur.id === user.id ? duel.adversaire : duel.provocateur;
        const monScore = duel.provocateur.id === user.id ? duel.scoreProvocateur : duel.scoreAdversaire;
        const scoreAdversaire = duel.provocateur.id === user.id ? duel.scoreAdversaire : duel.scoreProvocateur;
        const victoire = monScore > scoreAdversaire;
        
        newNotifications.push({
          id: `finished-${duel.id}`,
          type: 'finished',
          title: victoire ? 'Victoire !' : 'Défaite',
          message: `Duel terminé contre ${adversaire.pseudo} : ${monScore}-${scoreAdversaire}`,
          link: '/app/duels?tab=duels-recents',
          data: duel,
          timestamp: new Date(duel.dateValidation)
        });
      });

      // Trier par timestamp (plus récent en premier)
      newNotifications.sort((a, b) => b.timestamp - a.timestamp);

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  // Marquer une notification comme lue
  const markAsRead = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = () => {
    setNotifications([]);
  };

  // Charger les notifications au démarrage et toutes les 30 secondes
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      
      const interval = setInterval(loadNotifications, 30000); // 30 secondes
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const value = {
    notifications,
    unreadCount: notifications.length,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};