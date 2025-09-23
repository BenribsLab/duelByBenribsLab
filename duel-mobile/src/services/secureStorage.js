import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

// Storage keys
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  REFRESH_TOKEN: 'refresh_token',
};

class SecureStorageService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    console.log(
      `Storage Preferences initialized - Mode: ${
        this.isNative ? 'Native (Android/iOS)' : 'Web (localStorage)'
      }`
    );
  }

  // Save auth token
  async saveAuthToken(token) {
    try {
      await Preferences.set({
        key: STORAGE_KEYS.AUTH_TOKEN,
        value: token,
      });
      console.log('Auth token saved');
    } catch (error) {
      console.error('Error saveAuthToken:', error);
      throw error;
    }
  }

  // Get auth token
  async getAuthToken() {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEYS.AUTH_TOKEN });
      return value || null;
    } catch (error) {
      console.error('Error getAuthToken:', error);
      return null;
    }
  }

  // Remove auth token
  async clearAuthToken() {
    try {
      await Preferences.remove({ key: STORAGE_KEYS.AUTH_TOKEN });
      console.log('Auth token removed');
    } catch (error) {
      console.error('Error clearAuthToken:', error);
    }
  }

  // Save user data
  async saveUserData(userData) {
    try {
      await Preferences.set({
        key: STORAGE_KEYS.USER_DATA,
        value: JSON.stringify(userData),
      });
      console.log('User data saved');
    } catch (error) {
      console.error('Error saveUserData:', error);
      throw error;
    }
  }

  // Get user data
  async getUserData() {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEYS.USER_DATA });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getUserData:', error);
      return null;
    }
  }

  // Remove user data
  async clearUserData() {
    try {
      await Preferences.remove({ key: STORAGE_KEYS.USER_DATA });
      console.log('User data removed');
    } catch (error) {
      console.error('Error clearUserData:', error);
    }
  }

  // Save refresh token
  async saveRefreshToken(token) {
    try {
      await Preferences.set({
        key: STORAGE_KEYS.REFRESH_TOKEN,
        value: token,
      });
      console.log('Refresh token saved');
    } catch (error) {
      console.error('Error saveRefreshToken:', error);
      throw error;
    }
  }

  // Get refresh token
  async getRefreshToken() {
    try {
      const { value } = await Preferences.get({ key: STORAGE_KEYS.REFRESH_TOKEN });
      return value || null;
    } catch (error) {
      console.error('Error getRefreshToken:', error);
      return null;
    }
  }

  // Nettoyage agressif
  async clearAllStorage() {
    try {
      console.log('🔄 Nettoyage agressif de tout le stockage...');

      // 1. Supprimer clés connues
      await Promise.all([
        Preferences.remove({ key: STORAGE_KEYS.AUTH_TOKEN }),
        Preferences.remove({ key: STORAGE_KEYS.USER_DATA }),
        Preferences.remove({ key: STORAGE_KEYS.REFRESH_TOKEN }),
      ]);

      // 2. Essayer de tout nettoyer avec clear()
      try {
        await Preferences.clear();
        console.log('✅ Preferences.clear() réussi');
      } catch {
        console.log('⚠️ Preferences.clear() échoué, nettoyage individuel fait');
      }

      // 3. Nettoyer WebView
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.clear();
          window.sessionStorage.clear();
          // Cookies avec tous les domaines/paths possibles
          document.cookie.split(';').forEach(c => {
            const cookieName = c.replace(/^ +/, '').replace(/=.*/, '');
            if (cookieName.trim()) {
              // Supprimer pour tous les paths et domaines possibles
              document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
              document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
              document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
            }
          });

          if (window.indexedDB) {
            try {
              const databases = await window.indexedDB.databases();
              await Promise.all(
                databases.map(db => {
                  return new Promise(resolve => {
                    const req = window.indexedDB.deleteDatabase(db.name);
                    req.onsuccess = () => resolve();
                    req.onerror = () => resolve();
                    req.onblocked = () => resolve(); // Important pour éviter les blocages
                  });
                })
              );
            } catch (err) {
              console.warn('IndexedDB cleanup failed:', err);
            }
          }

          // Cache API - vider tous les caches Web
          if ('caches' in window) {
            try {
              const cacheNames = await caches.keys();
              await Promise.all(cacheNames.map(name => caches.delete(name)));
              console.log('✅ Cache API vidé');
            } catch (err) {
              console.warn('Cache API cleanup failed:', err);
            }
          }

          // Service Workers - désinscrire
          if ('serviceWorker' in navigator) {
            try {
              const registrations = await navigator.serviceWorker.getRegistrations();
              await Promise.all(registrations.map(reg => reg.unregister()));
              console.log('✅ Service Workers désinscris');
            } catch (err) {
              console.warn('SW cleanup failed:', err);
            }
          }

          console.log('✅ WebView storage complètement nettoyé');
        } catch (err) {
          console.warn('WebView cleanup failed:', err);
        }
      }

      console.log('✅ Nettoyage agressif terminé');
    } catch (error) {
      console.error('❌ Error clearAllStorage:', error);
    }
  }

  // Alias pour AuthContext
  async clearAllAuthData() {
    return await this.clearAllStorage();
  }

  // Test storage
  async testStorage() {
    console.log('Testing storage...');
    const testKey = 'test_key';
    const testValue = 'test_value_' + Date.now();

    try {
      await Preferences.set({ key: testKey, value: testValue });
      console.log('Write test OK');

      const { value } = await Preferences.get({ key: testKey });
      console.log(value === testValue ? 'Read test OK' : 'Read test FAILED');

      await Preferences.remove({ key: testKey });
      console.log('Remove test OK');
      console.log('All storage tests passed');
      return true;
    } catch (error) {
      console.error('Storage test failed:', error);
      return false;
    }
  }

  // Diagnostic
  async getDiagnosticInfo() {
    const info = {
      capacitorData: {},
      webViewData: {},
      system: {},
    };

    try {
      const token = await Preferences.get({ key: STORAGE_KEYS.AUTH_TOKEN });
      const user = await Preferences.get({ key: STORAGE_KEYS.USER_DATA });
      const refresh = await Preferences.get({ key: STORAGE_KEYS.REFRESH_TOKEN });

      info.capacitorData = {
        hasAuthToken: !!token.value,
        hasUserData: !!user.value,
        hasRefreshToken: !!refresh.value,
        tokenLength: token.value ? token.value.length : 0,
        userDataSize: user.value ? user.value.length : 0,
      };

      if (typeof window !== 'undefined') {
        info.webViewData = {
          localStorageItems: window.localStorage.length,
          sessionStorageItems: window.sessionStorage.length,
          cookieCount: document.cookie.split(';').filter(c => c.trim()).length,
          userAgent: navigator.userAgent.includes('wv') ? 'WebView' : 'Browser',
          localStorageKeys: Array.from({ length: window.localStorage.length }, (_, i) =>
            window.localStorage.key(i)
          ),
        };
      }

      info.system = {
        platform: Capacitor.getPlatform(),
        isNative: Capacitor.isNativePlatform(),
        timestamp: new Date().toISOString(),
      };

      console.log('📊 Diagnostic du stockage:', info);
      return info;
    } catch (error) {
      console.error('❌ Erreur diagnostic:', error);
      return { error: error.message };
    }
  }
}

export default new SecureStorageService();
