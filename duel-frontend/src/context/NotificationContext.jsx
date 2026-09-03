import { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  // Notifications écartées manuellement (bouton ✕). Le serveur ne mémorise
  // qu'une date globale de dernière consultation, pas un état par notification :
  // on garde donc cet écartement côté session, sinon l'élément réapparaîtrait au
  // prochain sondage.
  const [dismissedIds, setDismissedIds] = useState(() => new Set());
  const { user, refreshUser } = useAuth();

  // Le sondage périodique ne se recrée que si l'identifiant change : sans ces
  // références, son closure garderait indéfiniment la première version de
  // `user` et de `dismissedIds`, et rappellerait des notifications déjà lues ou
  // fermées toutes les 30 secondes.
  const userRef = useRef(user);
  const dismissedIdsRef = useRef(dismissedIds);
  useEffect(() => { userRef.current = user; }, [user]);
  useEffect(() => { dismissedIdsRef.current = dismissedIds; }, [dismissedIds]);

  // Fonction pour charger les notifications avec filtrage intelligent
  const loadNotifications = async () => {
    return loadNotificationsWithFreshUser(userRef.current);
  };

  // Fonction pour charger les notifications avec des données utilisateur spécifiques
  const loadNotificationsWithFreshUser = async (userData) => {
    if (!userData?.id) return;

    try {
      // Récupérer la date de dernière consultation
      const derniereConsultation = userData.derniereConsultationNotifications;
      const cutoffDate = derniereConsultation
        ? new Date(derniereConsultation)
        : new Date('1970-01-01');

      console.log('🔍 USER dans loadNotifications:', userData);
      console.log('📅 derniereConsultationNotifications:', derniereConsultation);
      console.log('⏰ Filtrage notifications depuis:', cutoffDate);

      const response = await duelsService.getMyDuels(userData.id);
      const duels = response.data.data;

      // On prend tous les duels récents (sans filtrage par cutoffDate encore)
      const duelsRecents = duels.filter((duel) => {
        const dateCreation = new Date(duel.dateProposition);
        const dateAcceptation = duel.dateAcceptation ? new Date(duel.dateAcceptation) : null;
        const dateValidation = duel.dateValidation ? new Date(duel.dateValidation) : null;
        const now = new Date();

        // Garder les duels qui ont eu une activité dans les 7 derniers jours
        return (
          (now - dateCreation) < 7 * 24 * 60 * 60 * 1000 ||
          (dateAcceptation && (now - dateAcceptation) < 7 * 24 * 60 * 60 * 1000) ||
          (dateValidation && (now - dateValidation) < 7 * 24 * 60 * 60 * 1000)
        );
      });

      console.log(`Duels récents: ${duelsRecents.length}/${duels.length} duels`);

      const newNotifications = [];

      // Invitations reçues
      const invitationsRecues = duelsRecents.filter(
        (d) => d.etat === 'PROPOSE' && d.adversaire.id === userData.id
      );

      invitationsRecues.forEach((duel) => {
        newNotifications.push({
          id: `invitation-${duel.id}`,
          type: 'invitation',
          title: 'Nouveau défi reçu',
          message: `${duel.provocateur.pseudo} vous a défié !`,
          link: '/app/duels?tab=invitations-recues',
          data: duel,
          timestamp: new Date(duel.dateProposition),
        });
      });

      // Défis acceptés (mes défis acceptés récemment)
      const defisAcceptes = duelsRecents.filter(
        (d) =>
          d.etat === 'A_JOUER' &&
          d.provocateur.id === userData.id &&
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
        (d) => d.etat === 'PROPOSE_SCORE' && (d.provocateur.id === userData.id || d.adversaire.id === userData.id)
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
          (d.provocateur.id === userData.id || d.adversaire.id === userData.id) &&
          d.dateValidation &&
          new Date() - new Date(d.dateValidation) < 24 * 60 * 60 * 1000
      );

      duelsTermines.forEach((duel) => {
        const adversaire = duel.provocateur.id === userData.id ? duel.adversaire : duel.provocateur;
        const monScore = duel.provocateur.id === userData.id ? duel.scoreProvocateur : duel.scoreAdversaire;
        const scoreAdversaire = duel.provocateur.id === userData.id ? duel.scoreAdversaire : duel.scoreProvocateur;
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

      // La date de dernière consultation ne sert plus à masquer les
      // notifications, seulement à distinguer les nouvelles : sinon, ouvrir la
      // cloche (ce qui avance cette date) vidait la liste avant qu'on ait pu la
      // lire. On écarte en revanche celles fermées manuellement via ✕.
      const notificationsVisibles = newNotifications
        .filter((notification) => !dismissedIdsRef.current.has(notification.id))
        .map((notification) => ({
          ...notification,
          isUnread: notification.timestamp > cutoffDate,
        }));

      // Trier par date
      notificationsVisibles.sort((a, b) => b.timestamp - a.timestamp);

      setNotifications(notificationsVisibles);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  // Marquer les notifications comme consultées (appel API uniquement)
  const markNotificationsAsRead = async () => {
    if (!user?.id) return;
    
    try {
      console.log('🔄 AVANT API - user.derniereConsultationNotifications:', user.derniereConsultationNotifications);
      
      // 1. Appeler l'API pour mettre à jour la date en base
      await duellistesService.markNotificationsAsRead(user.id);
      console.log('✅ Notifications marquées comme consultées en base');
      
      // 2. Recharger les données utilisateur pour avoir la nouvelle date
      console.log('🔄 Avant refreshUser...');
      const freshUser = await refreshUser();
      console.log('✅ Données utilisateur rechargées');
      console.log('🆕 APRES refreshUser - freshUser.derniereConsultationNotifications:', freshUser?.derniereConsultationNotifications);
      
      // 3. Recharger les notifications en utilisant les données fraîches
      await loadNotificationsWithFreshUser(freshUser);
      console.log('✅ Notifications rechargées avec nouveau filtrage');
      
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des notifications:', error);
    }
  };

  // Marquer comme lues ET retirer de l'affichage
  const markAllAsReadAndClear = async () => {
    try {
      const idsVisibles = notifications.map((n) => n.id);
      setDismissedIds((prev) => {
        const suivant = new Set(prev);
        idsVisibles.forEach((id) => suivant.add(id));
        return suivant;
      });
      setNotifications([]);
      await markNotificationsAsRead();
    } catch (error) {
      console.error('❌ Erreur lors de l\'effacement des notifications:', error);
    }
  };

  // Fermeture manuelle d'une seule notification (bouton ✕) : purement locale.
  // Elle est mémorisée dans `dismissedIds` pour que le sondage ne la fasse pas
  // revenir, sans toucher aux autres notifications encore affichées.
  const markAsRead = (notificationId) => {
    setDismissedIds((prev) => new Set(prev).add(notificationId));
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const markAllAsRead = () => {
    markAllAsReadAndClear();
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
    // Le compteur ne porte que sur les nouveautés : la liste, elle, reste
    // consultable même une fois tout marqué comme lu.
    unreadCount: notifications.filter((n) => n.isUnread).length,
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
