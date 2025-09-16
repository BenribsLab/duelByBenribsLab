import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Configuration Firebase (récupérée depuis votre google-services.json)
const firebaseConfig = {
  apiKey: "AIzaSyB3YPe-e0nZ4RQdIiwOXmwK80N0HhdU2Tg",
  authDomain: "duelbybenribslab.firebaseapp.com",
  projectId: "duelbybenribslab", 
  storageBucket: "duelbybenribslab.firebasestorage.app",
  messagingSenderId: "586179973861",
  appId: "1:586179973861:android:0b9af5fa688b4f9d163a0c"
};

class PushNotificationService {
  constructor() {
    this.token = null;
    this.isInitialized = false;
    this.messaging = null;
  }

  async init() {
    if (this.isInitialized) return;

    try {
      // Vérifier si Firebase Messaging est supporté
      const supported = await isSupported();
      if (!supported) {
        console.warn('Firebase Messaging n\'est pas supporté sur ce navigateur');
        return;
      }

      // Initialiser Firebase
      const app = initializeApp(firebaseConfig);
      this.messaging = getMessaging(app);

      // Demander les permissions et obtenir le token
      await this.requestPermission();
      
      // Écouter les messages
      this.setupMessageListener();
      
      this.isInitialized = true;
      console.log('✅ Service de notifications initialisé');
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des notifications:', error);
    }
  }

  async requestPermission() {
    try {
      // Demander la permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Permission accordée');
        
        // Obtenir le token FCM
        const token = await getToken(this.messaging, {
          vapidKey: 'BGWYyktE_JnPbLeQwTOsCd_LQv5hjGuueHbNZsA4zkTw4XYNFgUoya8SkNt13xq8K9axqwn4kMXsN_ofiVbXguk'
        });
        
        if (token) {
          console.log('📱 Token FCM:', token);
          this.token = token;
          await this.sendTokenToServer(token);
        }
      } else {
        console.warn('❌ Permission refusée');
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
    }
  }

  setupMessageListener() {
    // Écouter les messages quand l'app est ouverte
    onMessage(this.messaging, (payload) => {
      console.log('🔔 Message reçu:', payload);
      
      // Afficher une notification personnalisée
      this.showNotification(payload);
      
      // Émettre un événement pour l'app
      window.dispatchEvent(new CustomEvent('firebaseMessage', {
        detail: payload
      }));
    });
  }

  showNotification(payload) {
    const { title, body, icon } = payload.notification || {};
    
    // Créer une notification navigateur
    if (Notification.permission === 'granted') {
      const notification = new Notification(title || 'Duel By Benribs Lab', {
        body: body || 'Nouvelle notification',
        icon: icon || '/logo_cey_noir.png',
        tag: 'duel-notification',
        requireInteraction: true
      });

      // Gérer le clic sur la notification
      notification.onclick = () => {
        window.focus();
        this.handleNotificationClick(payload);
        notification.close();
      };
    }
  }

  async sendTokenToServer(token) {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!userData.id) {
        console.warn('Utilisateur non connecté, token non envoyé');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${userData.id}/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userData.token}`
        },
        body: JSON.stringify({ 
          pushToken: token,
          platform: 'web'
        })
      });

      if (response.ok) {
        console.log('✅ Token envoyé au serveur');
      }
    } catch (error) {
      console.error('Erreur envoi token:', error);
    }
  }

  handleNotificationClick(payload) {
    const data = payload.data || {};
    
    switch (data.type) {
      case 'invitation':
        window.location.href = '/duels?tab=invitations-recues';
        break;
      case 'accepted':
        window.location.href = '/duels?tab=duels-actifs';
        break;
      case 'score':
        window.location.href = '/duels?tab=duels-actifs';
        break;
      case 'finished':
        window.location.href = '/duels?tab=duels-recents';
        break;
      default:
        window.location.href = '/dashboard';
    }
  }

  getToken() {
    return this.token;
  }
}

// Instance singleton
export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;