const admin = require('firebase-admin');

class PushNotificationService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialiser Firebase Admin SDK
   */
  init() {
    try {
      // Vérifier que les variables d'environnement Firebase sont définies
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKeyId = process.env.FIREBASE_PRIVATE_KEY_ID;
      const clientId = process.env.FIREBASE_CLIENT_ID;

      // Si les credentials ne sont pas configurés, on désactive les push notifications
      if (!privateKey || !clientEmail || privateKey.includes('votre_private_key') || clientEmail.includes('xxxxx')) {
        console.log('⚠️ Credentials Firebase non configurés. Push notifications désactivées.');
        console.log('ℹ️ Pour activer les push notifications:');
        console.log('   1. Aller sur https://console.firebase.google.com/project/duelbybenribslab/settings/serviceaccounts/adminsdk');
        console.log('   2. Cliquer "Generate new private key"');
        console.log('   3. Télécharger le fichier JSON et configurer les variables dans .env');
        return;
      }

      const serviceAccount = {
        "type": "service_account",
        "project_id": "duelbybenribslab",
        "private_key_id": privateKeyId,
        "private_key": privateKey.replace(/\\n/g, '\n'),
        "client_email": clientEmail,
        "client_id": clientId,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token"
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'duelbybenribslab'
      });

      this.initialized = true;
      console.log('✅ Firebase Admin SDK initialisé');

    } catch (error) {
      console.error('❌ Erreur initialisation Firebase Admin:', error.message);
      console.log('ℹ️ Push notifications désactivées. Vérifiez la configuration Firebase dans .env');
    }
  }

  /**
   * Envoyer une notification push à un utilisateur
   * @param {string} token - Token FCM du destinataire
   * @param {Object} notification - Contenu de la notification
   * @param {Object} data - Données additionnelles
   */
  async sendNotification(token, notification, data = {}) {
    if (!this.initialized) {
      console.log('📱 Push notification simulée (Firebase non configuré):', {
        token: token?.substring(0, 20) + '...',
        title: notification.title,
        body: notification.body
      });
      return null;
    }

    try {
      const message = {
        token: token,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          ...data,
          click_action: data.link || '/dashboard'
        },
        webpush: {
          fcm_options: {
            link: data.link || '/dashboard'
          }
        }
      };

      const response = await admin.messaging().send(message);
      console.log('✅ Notification envoyée:', response);
      return response;

    } catch (error) {
      console.error('❌ Erreur envoi notification:', error);
      
      // Si le token est invalide, on pourrait le supprimer de la base
      if (error.code === 'messaging/registration-token-not-registered') {
        console.warn(`Token invalide: ${token}`);
        // TODO: Supprimer le token de la base de données
      }
      
      throw error;
    }
  }

  /**
   * Envoyer une notification à plusieurs utilisateurs
   * @param {string[]} tokens - Tokens FCM des destinataires
   * @param {Object} notification - Contenu de la notification
   * @param {Object} data - Données additionnelles
   */
  async sendMulticast(tokens, notification, data = {}) {
    if (!this.initialized || !tokens.length) {
      if (!this.initialized && tokens.length > 0) {
        console.log('📱 Push notifications simulées (Firebase non configuré):', {
          count: tokens.length,
          title: notification.title,
          body: notification.body
        });
      }
      return null;
    }

    try {
      const message = {
        tokens: tokens,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          ...data,
          click_action: data.link || '/dashboard'
        },
        webpush: {
          fcm_options: {
            link: data.link || '/dashboard'
          }
        }
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`✅ Notifications envoyées: ${response.successCount}/${tokens.length}`);
      
      // Gérer les tokens invalides
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.warn(`Token invalide [${idx}]:`, resp.error?.code);
          }
        });
      }

      return response;

    } catch (error) {
      console.error('❌ Erreur envoi multicast:', error);
      throw error;
    }
  }

  /**
   * Créer une notification pour une invitation de duel
   */
  createInvitationNotification(provocateur, adversaire) {
    return {
      title: 'Nouvelle invitation de duel !',
      body: `${provocateur.pseudo} vous défie en duel`,
      icon: '/logo_cey_noir.png',
      data: {
        type: 'invitation',
        link: '/duels?tab=invitations-recues',
        provocateurId: provocateur.id.toString(),
        adversaireId: adversaire.id.toString()
      }
    };
  }

  /**
   * Créer une notification pour l'acceptation d'un duel
   */
  createAcceptedNotification(adversaire, provocateur) {
    return {
      title: 'Duel accepté !',
      body: `${adversaire.pseudo} a accepté votre défi`,
      icon: '/logo_cey_noir.png',
      data: {
        type: 'accepted',
        link: '/duels?tab=duels-actifs',
        provocateurId: provocateur.id.toString(),
        adversaireId: adversaire.id.toString()
      }
    };
  }

  /**
   * Créer une notification pour la saisie d'un score
   */
  createScoreNotification(saisisseur, adversaire) {
    return {
      title: 'Score saisi !',
      body: `${saisisseur.pseudo} a saisi le score de votre duel`,
      icon: '/logo_cey_noir.png',
      data: {
        type: 'score',
        link: '/duels?tab=duels-actifs'
      }
    };
  }

  /**
   * Créer une notification pour un duel terminé
   */
  createFinishedNotification(vainqueur, perdant, score) {
    return {
      victory: {
        title: 'Victoire !',
        body: `Vous avez remporté le duel ${score}`,
        icon: '/logo_cey_noir.png',
        data: {
          type: 'finished',
          result: 'victory',
          link: '/duels?tab=duels-recents'
        }
      },
      defeat: {
        title: 'Défaite',
        body: `Vous avez perdu le duel ${score}`,
        icon: '/logo_cey_noir.png',
        data: {
          type: 'finished',
          result: 'defeat',
          link: '/duels?tab=duels-recents'
        }
      }
    };
  }
}

// Instance singleton
const pushNotificationService = new PushNotificationService();

module.exports = pushNotificationService;