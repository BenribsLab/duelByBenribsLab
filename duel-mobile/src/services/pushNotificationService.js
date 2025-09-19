import { PushNotifications } from "@capacitor/push-notifications"
import config from "../config"

class PushNotificationService {
  constructor() {
    this.token = null
    this.isInitialized = false
  }

  async init() {
    if (this.isInitialized) return

    try {
      await this.requestPermission()
      this.setupListeners()
      this.isInitialized = true
    } catch (error) {
      console.error("Erreur lors de l initialisation des notifications:", error)
    }
  }

  async requestPermission() {
    try {
      const permission = await PushNotifications.requestPermissions()
      if (permission.receive === "granted") {
        await PushNotifications.register()
      } else {
        console.warn("Permission refusee:", permission)
      }
    } catch (error) {
      console.error("Erreur lors de la demande de permission:", error)
    }
  }

  setupListeners() {
    PushNotifications.addListener("registration", (token) => {
      console.log("Token FCM recu:", token.value)
      this.token = token.value
      this.sendTokenToServer(token.value)
    })

    PushNotifications.addListener("registrationError", (error) => {
      console.error("Erreur d enregistrement:", error)
    })

    PushNotifications.addListener("pushNotificationReceived", (notification) => {
      console.log("NOTIFICATION RECUE APP OUVERTE:", notification)
      console.log("DETAILS NOTIFICATION:", JSON.stringify(notification, null, 2))
    })

    PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      console.log("NOTIFICATION CLIQUEE:", action)
      console.log("DETAILS ACTION:", JSON.stringify(action, null, 2))
    })
  }

  async sendTokenToServer(token) {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}")
      if (!userData.id) return

      const response = await fetch(`${config.API_BASE_URL}/users/${userData.id}/push-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          pushToken: token,
          platform: "android"
        })
      })

      if (response.ok) {
        console.log("Token envoye au serveur")
      } else {
        console.warn("Erreur lors de l envoi du token au serveur")
      }
    } catch (error) {
      console.error("Erreur envoi token:", error)
    }
  }

  async unregister() {
    try {
      const userData = JSON.parse(localStorage.getItem("user") || "{}")
      if (userData.id) {
        await fetch(`${config.API_BASE_URL}/users/${userData.id}/push-token`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          }
        })
      }

      await PushNotifications.removeAllListeners()
      this.token = null
      this.isInitialized = false
    } catch (error) {
      console.error("Erreur lors de la desinscription:", error)
    }
  }

  getToken() {
    return this.token
  }
}

export const pushNotificationService = new PushNotificationService()
export default pushNotificationService
