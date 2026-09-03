import { Capacitor } from '@capacitor/core';
import { KeychainAccess, SecureStorage } from '@aparajita/capacitor-secure-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  REFRESH_TOKEN: 'refresh_token',
};

class SecureStorageService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.ready = this.isNative
      ? (async () => {
          await SecureStorage.setKeyPrefix('duel_');
          await SecureStorage.setSynchronize(false);
          await SecureStorage.setDefaultKeychainAccess(KeychainAccess.whenUnlockedThisDeviceOnly);
        })()
      : Promise.resolve();
  }

  async set(key, value) {
    await this.ready;
    if (this.isNative) return SecureStorage.set(key, value);
    window.sessionStorage.setItem(`duel_${key}`, JSON.stringify(value));
  }

  async get(key) {
    await this.ready;
    if (this.isNative) return SecureStorage.get(key);
    const value = window.sessionStorage.getItem(`duel_${key}`);
    return value === null ? null : JSON.parse(value);
  }

  async remove(key) {
    await this.ready;
    if (this.isNative) return SecureStorage.remove(key);
    window.sessionStorage.removeItem(`duel_${key}`);
  }

  async saveAuthToken(token) {
    return this.set(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async getAuthToken() {
    try {
      return await this.get(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('Impossible de lire le jeton sécurisé:', error.message);
      return null;
    }
  }

  async clearAuthToken() {
    return this.remove(STORAGE_KEYS.AUTH_TOKEN);
  }

  async saveUserData(userData) {
    return this.set(STORAGE_KEYS.USER_DATA, userData);
  }

  async getUserData() {
    try {
      return await this.get(STORAGE_KEYS.USER_DATA);
    } catch (error) {
      console.error('Impossible de lire le profil sécurisé:', error.message);
      return null;
    }
  }

  async clearUserData() {
    return this.remove(STORAGE_KEYS.USER_DATA);
  }

  async saveRefreshToken(token) {
    return this.set(STORAGE_KEYS.REFRESH_TOKEN, token);
  }

  async getRefreshToken() {
    try {
      return await this.get(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error('Impossible de lire le refresh token sécurisé:', error.message);
      return null;
    }
  }

  async clearAllStorage() {
    await Promise.all(Object.values(STORAGE_KEYS).map((key) => this.remove(key)));
  }

  async clearAllAuthData() {
    return this.clearAllStorage();
  }

  async testStorage() {
    const key = 'storage_test';
    try {
      await this.set(key, 'ok');
      const value = await this.get(key);
      await this.remove(key);
      return value === 'ok';
    } catch {
      return false;
    }
  }

  async getDiagnosticInfo() {
    return {
      hasAuthToken: Boolean(await this.getAuthToken()),
      hasUserData: Boolean(await this.getUserData()),
      platform: Capacitor.getPlatform(),
      isNative: this.isNative,
    };
  }
}

export default new SecureStorageService();
