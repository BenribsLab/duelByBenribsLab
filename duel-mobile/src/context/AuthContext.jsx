import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import pushNotificationService from '../services/pushNotificationService';
import secureStorage from '../services/secureStorage';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialiser l'authentification au chargement
  useEffect(() => {
    const initAuth = async () => {
      console.log('🚀 Initialisation de l\'authentification...');
      try {
        setIsInitializing(true);
        
        // Test du système de stockage
        const storageWorks = await secureStorage.testStorage();
        console.log('🧪 Test du stockage:', storageWorks ? 'SUCCÈS' : 'ÉCHEC');
        
        if (!storageWorks) {
          throw new Error('Le stockage sécurisé ne fonctionne pas');
        }
        
        // Récupérer les données stockées de manière sécurisée
        console.log('🔍 Recherche des données stockées...');
        const [storedToken, storedUserData] = await Promise.all([
          secureStorage.getAuthToken(),
          secureStorage.getUserData()
        ]);

        console.log('📦 Résultat de la recherche:', {
          hasToken: !!storedToken,
          hasUserData: !!storedUserData,
          tokenPreview: storedToken ? `${storedToken.substring(0, 20)}...` : 'N/A'
        });

        if (storedToken && storedUserData) {
          console.log('🔐 Token et données utilisateur trouvés, vérification auprès du serveur...');
          // Vérifier la validité du token auprès du serveur
          try {
            // Configurer axios temporairement pour la vérification
            const tempHeaders = { 'Authorization': `Bearer ${storedToken}` };
            const response = await axios.get(`${config.API_BASE_URL}/auth/me`, { headers: tempHeaders });
            
            if (response.data.success) {
              // Token valide, restaurer la session
              console.log('✅ Token valide, restauration de la session...');
              setToken(storedToken);
              setUser(storedUserData);
              
              // Configurer axios pour inclure le token dans toutes les requêtes
              axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
              
              console.log('✅ Session restaurée automatiquement');
              
              // Initialiser les notifications push après la restauration
              setTimeout(() => {
                pushNotificationService.init();
              }, 1000);
            } else {
              throw new Error('Token invalide');
            }
          } catch (error) {
            console.log('🔄 Token expiré ou invalide, nettoyage des données stockées');
            // Token invalide, nettoyer les données
            await secureStorage.clearAllAuthData();
          }
        } else {
          console.log('ℹ️ Aucun token ou données utilisateur trouvés - première connexion');
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de l\'authentification:', error);
        // En cas d'erreur, nettoyer les données corrompues
        try {
          await secureStorage.clearAllStorage();
        } catch (cleanError) {
          console.error('❌ Erreur lors du nettoyage:', cleanError);
        }
      } finally {
        console.log('🏁 Initialisation terminée');
        setLoading(false);
        setIsInitializing(false);
      }
    };

    initAuth();
  }, []);

  // Fonction de connexion
  const login = async (userData, authToken) => {
    console.log('🔑 === DÉBUT LOGIN ===');
    console.log('🔑 userData reçu:', userData);
    console.log('🔑 authToken reçu:', authToken ? `Token présent (${authToken.substring(0, 20)}...)` : 'AUCUN TOKEN');
    
    try {
      console.log('📝 Mise à jour du state React...');
      setUser(userData);
      setToken(authToken);
      console.log('✅ State React mis à jour');
      
      console.log('💾 Début sauvegarde sécurisée...');
      // Sauvegarder de manière sécurisée
      await Promise.all([
        secureStorage.saveAuthToken(authToken),
        secureStorage.saveUserData(userData)
      ]);
      console.log('✅ Sauvegarde sécurisée terminée');
      
      console.log('🔧 Configuration axios...');
      // Configurer axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      console.log('✅ Axios configuré avec token');
      
      console.log('✅ Session sauvegardée de manière sécurisée');
      
      console.log('📱 Initialisation notifications push...');
      // Initialiser les notifications push après la connexion
      setTimeout(() => {
        pushNotificationService.init();
      }, 1000); // Petit délai pour s'assurer que l'auth est bien configurée
      
      console.log('🔑 === FIN LOGIN SUCCÈS ===');
      
    } catch (error) {
      console.error('🔑 === ERREUR DANS LOGIN ===');
      console.error('❌ Erreur lors de la connexion:', error);
      console.error('❌ Stack trace:', error.stack);
      throw error;
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      if (token) {
        await axios.post(`${config.API_BASE_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
      }
      setUser(null);
      setToken(null);
      
      // Nettoyer le stockage sécurisé - VERSION AMÉLIORÉE
      console.log('🔄 Déconnexion avec nettoyage complet...');
      await secureStorage.clearAllAuthData();
      
      // Nettoyer axios
      delete axios.defaults.headers.common['Authorization'];
      
      console.log('✅ Déconnexion et nettoyage sécurisé terminés');
      console.log('💡 Si vous rencontrez des problèmes (notifications, etc.), utilisez le diagnostic dans les paramètres');
      
      // Désactiver les notifications push lors de la déconnexion
      pushNotificationService.unregister();
      
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
    }
  };

  // Fonction de mise à jour des données utilisateur
  const updateUser = async (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };
      setUser(newUserData);
      
      // Mettre à jour le stockage sécurisé
      await secureStorage.saveUserData(newUserData);
      
      console.log('✅ Données utilisateur mises à jour de manière sécurisée');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  };

  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = () => {
    return !!(user && token);
  };

  // Vérifier la validité du token (optionnel)
  const checkTokenValidity = async () => {
    if (!token) return false;

    try {
      const response = await axios.get(`${config.API_BASE_URL}/auth/me`);
      return response.data.success;
    } catch (error) {
      console.error('Token invalide:', error);
      logout(); // Déconnecter si le token est invalide
      return false;
    }
  };

  // Intercepteur axios pour gérer les erreurs d'authentification
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && token) {
          // Token expiré ou invalide
          console.log('Token expiré, déconnexion automatique');
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [token]);

  const value = {
    user,
    token,
    loading,
    isInitializing,
    login,
    logout,
    updateUser,
    isAuthenticated,
    checkTokenValidity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext };
export default AuthProvider;
