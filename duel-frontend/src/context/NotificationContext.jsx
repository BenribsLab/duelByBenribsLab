import { createContext, useContext, useState, useEffect } from 'react';
import { duelsService, duellistesService } from '../services/api';
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
  const { user, refreshUser } = useAuth();

  // Fonction pour charger les notifications avec filtrage intelligent
  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      // Récupérer la date de dernière consultation
      const derniereConsultation = user.derniereConsultationNotifications;
      const cutoffDate = derniereConsultation
        ? new Date(derniereConsultation)
        : new Date('1970-01-01');

      console.log('Filtrage notifications depuis:', cutoffDate);

      const response = await duelsService.getMyDuels(user.id);
      const duels = response.data.data;

      // FILTRAGE INTELLIGENT : ne traiter que les duels récents
      const duelsRecents = duels.filter((duel) => {
        const dateCreation = new Date(duel.dateCreation);
        const dateAcceptation = duel.dateAcceptation ? new Date(duel.dateAcceptation) : null;
        const dateValidation = duel.dateValidation ? new Date(duel.dateValidation) : null;

        return (
          dateCreation > cutoffDate ||
          (dateAcceptation && dateAcceptation > cutoffDate) ||
          (dateValidation && dateValidation > cutoffDate)
        );
      });

      console.log(`Duels filtrés: ${duelsRecents.length}/${duels.length} duels récents`);

      const newNotifications = [];

      // Invitations reçues
      const invitationsRecues = duelsRecents.filter(
        (d) => d.etat === 'PROPOSE' && d.adversaire.id === user.id
      );

      invitationsRecues.forEach((duel) => {
        newNotifications.push({
          id: `invitation-${duel.id}`,
          type: 'invitation',
          title: 'Nouveau défi reçu',
          message: `${duel.provocateur.pseudo} vous a défié !`,
          link: '/app/duels?tab=invitations-recues',
          data: duel,
          timestamp: new Date(duel.dateCreation),
        });
      });

      // Défis acceptés (mes défis acceptés récemment)
      const defisAcceptes = duelsRecents.filter(
        (d) =>
          d.etat === 'A_JOUER' &&
          d.provocateur.id === user.id &&
          new Date() - new Date(d.dateAcceptation) < 24 * 60 * 60 * 1000
      );

      defisAcceptes.forEach((duel) => {
        newNotifications.push({
          id: `accepted-${duel.id}`,
          type: 'accepted',
          title: 'Défi accepté',
          message: `${duel.adversaire.pseudo} a accepté votre défi !`,
          link: '/app/duels?tab=duels-actifs',
          data: duel,
          timestamp: new Date(duel.dateAcceptation),
        });
      });

      // Propositions de score
      const propositionsScore = duelsRecents.filter(
        (d) => d.etat === 'PROPOSE_SCORE' && (d.provocateur.id === user.id || d.adversaire.id === user.id)
      );

      for (const duel of propositionsScore) {
        try {
          const validationsResponse = await duelsService.getById(duel.id);
          const duelDetaille = validationsResponse.data.data;

          if (duelDetaille.validations && duelDetaille.validations.length > 0) {
            const premierValidation = duelDetaille.validations[0];
            const proposeur = premierValidation.dueliste;

            if (proposeur.id !== user.id) {
              newNotifications.push({
                id: `score-${duel.id}`,
                type: 'score',
                title: 'Proposition de score',
                message: `${proposeur.pseudo} a proposé un score : ${duel.scoreProvocateur}-${duel.scoreAdversaire}`,
                link: '/app/duels?tab=duels-actifs',
                data: duel,
                timestamp: new Date(premierValidation.dateSaisie),
              });
            }
          }
        } catch (error) {
          console.error('Erreur lors de la récupération des détails du duel:', error);
        }
      }

      // Duels terminés (moins de 24h)
      const duelsTermines = duelsRecents.filter(
        (d) =>
          d.etat === 'VALIDE' &&
          (d.provocateur.id === user.id || d.adversaire.id === user.id) &&
          d.dateValidation &&
          new Date() - new Date(d.dateValidation) < 24 * 60 * 60 * 1000
      );

      duelsTermines.forEach((duel) => {
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
          timestamp: new Date(duel.dateValidation),
        });
      });

      // Trier par date
      newNotifications.sort((a, b) => b.timestamp - a.timestamp);

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  // Marquer les notifications comme consultées (appel API uniquement)
  const markNotificationsAsRead = async () => {
    if (!user?.id) return;
    
    try {
      // 1. Appeler l'API pour mettre à jour la date en base
      await duellistesService.markNotificationsAsRead(user.id);
      console.log('✅ Notifications marquées comme consultées en base');
      
      // 2. Recharger les données utilisateur pour avoir la nouvelle date
      await refreshUser();
      console.log('✅ Données utilisateur rechargées');
      
      // Note: on ne recharge pas loadNotifications() ici pour garder l'affichage
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des notifications:', error);
    }
  };

  // Marquer toutes les notifications comme lues ET vider le dropdown
  const markAllAsReadAndClear = async () => {
    try {
      // 1. Marquer en base
      await markNotificationsAsRead();
      
      // 2. Vider le dropdown immédiatement
      setNotifications([]);
      
      console.log('✅ Toutes les notifications effacées');
    } catch (error) {
      console.error('❌ Erreur lors de l\'effacement des notifications:', error);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const markAllAsRead = () => {
    setNotifications([]);
  };

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const value = {
    notifications,
    unreadCount: notifications.length,
    markAsRead,
    markAllAsRead,
    markNotificationsAsRead,
    markAllAsReadAndClear,
    refresh: loadNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
