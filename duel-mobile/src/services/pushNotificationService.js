import { PushNotifications } from "@capacitor/push-notifications";
import config from "../config";
import secureStorage from "./secureStorage";

class PushNotificationService {
  constructor() {
    this.token = null;
    this.isInitialized = false;
    this.navigationCallback = null;
  }

  setNavigationCallback(navigate) {
    this.navigationCallback = navigate;
  }

  async init() {
    if (this.isInitialized) {
      console.log("Service notifications deja initialise");
      return;
    }

    try {
      console.log("INIT NOTIFICATIONS - Debut");
      await this.requestPermission();
      await this.setupListeners();
      this.isInitialized = true;
      console.log("INIT NOTIFICATIONS - Succes");
    } catch (error) {
      console.error("INIT NOTIFICATIONS - Erreur:", error);
    }
  }

  async requestPermission() {
    try {
      console.log("PERMISSION - Demande permission");
      const permission = await PushNotifications.requestPermissions();
      console.log("PERMISSION - Reponse:", permission);

      if (permission.receive === "granted") {
        console.log("PERMISSION - Enregistrement...");
        await PushNotifications.register();
        console.log("PERMISSION - Enregistrement termine");
      } else {
        console.warn("PERMISSION - Refusee:", permission);
      }
    } catch (error) {
      console.error("PERMISSION - Erreur:", error);
    }
  }

  async setupListeners() {
    await PushNotifications.addListener("registration", (token) => {
      console.log("Token FCM recu:", token.value);
      this.token = token.value;
      this.sendTokenToServer(token.value);
    });

    await PushNotifications.addListener("registrationError", (error) => {
      console.error("Erreur enregistrement:", error);
    });

    await PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("Notification recue (app ouverte):", notification);
      console.log("Details notification:", JSON.stringify(notification, null, 2));
    });

    await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("Notification cliquee:", action);
      console.log("Details action:", JSON.stringify(action, null, 2));

      const notificationData = action.notification.data;
      console.log("Donnees notification:", notificationData);

      if (notificationData?.link && this.navigationCallback) {
        console.log("Navigation vers:", notificationData.link);
        this.navigationCallback(notificationData.link);
      }
    });
  }

  async sendTokenToServer(token) {
    try {
      console.log("TOKEN - Envoi au serveur:", token);
      const userData = await secureStorage.getUserData();
      const authToken = await secureStorage.getAuthToken();

      console.log("TOKEN - User data:", userData ? "present" : "absent");
      console.log("TOKEN - Auth token:", authToken ? "present" : "absent");

      if (!userData || !authToken) {
        console.log("TOKEN - Pas d utilisateur connecte ou token manquant");
        return;
      }

      console.log("TOKEN - User ID:", userData.id);
      if (!userData.id) return;

      const response = await fetch(`${config.API_BASE_URL}/users/${userData.id}/push-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({
          pushToken: token,
          platform: "android"
        })
      });

      console.log("TOKEN - Reponse serveur:", response.status);
      if (response.ok) {
        console.log("TOKEN - Envoye au serveur avec succes");
      } else {
        console.warn("TOKEN - Erreur lors de l envoi au serveur");
      }
    } catch (error) {
      console.error("TOKEN - Erreur envoi token:", error);
    }
  }

  async unregister() {
    try {
      const userData = await secureStorage.getUserData();
      const authToken = await secureStorage.getAuthToken();

      if (userData && authToken) {
        if (userData.id) {
          await fetch(`${config.API_BASE_URL}/users/${userData.id}/push-token`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${authToken}`
            }
          });
        }
      }

      await PushNotifications.removeAllListeners();
      this.token = null;
      this.isInitialized = false;
    } catch (error) {
      console.error("Erreur desinscription:", error);
    }
  }

  getToken() {
    return this.token;
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
