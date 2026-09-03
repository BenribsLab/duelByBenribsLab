import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

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

  // Initialiser l'authentification au chargement
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = sessionStorage.getItem('token');
        const storedUser = sessionStorage.getItem('user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Configurer axios pour inclure le token dans toutes les requêtes
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'authentification:', error);
        // Nettoyer les données corrompues
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Fonction de connexion
  const login = (userData, authToken) => {
    try {
      setUser(userData);
      setToken(authToken);
      
      sessionStorage.setItem('token', authToken);
      sessionStorage.setItem('user', JSON.stringify(userData));
      
      // Configurer axios
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  };

  // Fonction de déconnexion
  const logout = async (revoke = true) => {
    try {
      if (revoke && token) {
        await axios.post(`${config.API_BASE_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
      }
      setUser(null);
      setToken(null);
      
      // Nettoyer localStorage
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // Nettoyer axios
      delete axios.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Fonction de mise à jour des données utilisateur
  const updateUser = (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };
      setUser(newUserData);
      
      // Mettre à jour localStorage
      sessionStorage.setItem('user', JSON.stringify(newUserData));
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  };

  // Fonction pour recharger les données utilisateur depuis l'API
  const refreshUser = async () => {
    console.log('🔄 refreshUser called - user?.id:', user?.id, 'token:', !!token);
    
    if (!user?.id || !token) {
      console.log('❌ refreshUser: Pas de user.id ou token, retour undefined');
      return;
    }

    try {
      console.log('🔄 refreshUser: Appel API pour user', user.id);
      const response = await axios.get(`${config.API_BASE_URL}/duellistes/${user.id}`);
      console.log('🔍 refreshUser: Réponse complète de l\'API:', response.data);
      const freshUserData = response.data.data;
      console.log('📡 refreshUser: Données reçues de l\'API:', freshUserData);
      console.log('📅 refreshUser: derniereConsultationNotifications dans l\'API:', freshUserData?.derniereConsultationNotifications);
      
      updateUser(freshUserData);
      console.log('✅ refreshUser: updateUser appelé');
      
      return freshUserData;
    } catch (error) {
      console.error('Erreur lors du rechargement des données utilisateur:', error);
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
          logout(false);
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
    login,
    logout,
    updateUser,
    refreshUser,
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
