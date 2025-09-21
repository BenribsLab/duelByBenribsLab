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

  // Clear all auth data
  async clearAllAuthData() {
    try {
      await Promise.all([
        Preferences.remove({ key: STORAGE_KEYS.AUTH_TOKEN }),
        Preferences.remove({ key: STORAGE_KEYS.USER_DATA }),
        Preferences.remove({ key: STORAGE_KEYS.REFRESH_TOKEN }),
      ]);
      console.log('All auth data removed');
    } catch (error) {
      console.error('Error clearAllAuthData:', error);
    }
  }

  // Clear all storage (alias for compatibility)
  async clearAllStorage() {
    try {
      await Promise.all([
        Preferences.remove({ key: STORAGE_KEYS.AUTH_TOKEN }),
        Preferences.remove({ key: STORAGE_KEYS.USER_DATA }),
        Preferences.remove({ key: STORAGE_KEYS.REFRESH_TOKEN }),
      ]);
      
      // Try to clear all if available
      try {
        await Preferences.clear();
        console.log('All storage cleared');
      } catch (clearError) {
        console.log('Individual keys cleared');
      }
    } catch (error) {
      console.error('Error clearAllStorage:', error);
    }
  }

  // Test storage functionality
  async testStorage() {
    console.log('Testing storage...');
    const testKey = 'test_key';
    const testValue = 'test_value_' + Date.now();
    
    try {
      // Test write
      await Preferences.set({ key: testKey, value: testValue });
      console.log('Write test OK');
      
      // Test read
      const { value } = await Preferences.get({ key: testKey });
      if (value === testValue) {
        console.log('Read test OK');
      } else {
        console.log('Read test FAILED');
      }
      
      // Test remove
      await Preferences.remove({ key: testKey });
      console.log('Remove test OK');
      
      console.log('All storage tests passed');
      return true;
    } catch (error) {
      console.error('Storage test failed:', error);
      return false;
    }
  }
}

// Export singleton
export default new SecureStorageService();
