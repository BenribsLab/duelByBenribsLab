import axios from 'axios';
import config from '../config';
import secureStorage from './secureStorage';

// Créer l'instance axios
const api = axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter automatiquement le token d'authentification
api.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      await secureStorage.clearAuthToken();
      // Rediriger vers la page de connexion si nécessaire
      // Note: La gestion de la redirection peut être ajoutée selon le routeur utilisé
    }
    return Promise.reject(error);
  }
);

// Services API
export const duellistesService = {
  getAll: () => api.get('/duellistes'),
  getById: (id) => api.get(`/duellistes/${id}`),
  create: (dueliste) => api.post('/duellistes', dueliste),
  update: (id, dueliste) => api.put(`/duellistes/${id}`, dueliste),
  delete: (id) => api.delete(`/duellistes/${id}`),
};

export const duelsService = {
  getAll: () => api.get('/duels'),
  getMyDuels: (userId) => api.get(`/duels?duelisteId=${userId}`),
  getById: (id) => api.get(`/duels/${id}`),
  create: (duel) => api.post('/duels', duel),
  update: (id, duel) => api.put(`/duels/${id}`, duel),
  delete: (id) => api.delete(`/duels/${id}`),
  accept: (id, data) => api.put(`/duels/${id}/accepter`, data),
  refuse: (id, data) => api.put(`/duels/${id}/refuser`, data),
  validateScore: async (id, scoreData) => {
    return api.put(`/duels/${id}/score`, scoreData);
  },
  getProposition: async (id, duelisteId) => {
    return api.get(`/duels/${id}/proposition?duelisteId=${duelisteId}`);
  },
  acceptProposition: async (id, duelisteId) => {
    return api.put(`/duels/${id}/accepter-proposition`, { duelisteId });
  }
};

export const classementService = {
  get: () => api.get('/classement'),
  getJunior: () => api.get('/classement/junior'),
};

export const invitationsService = {
  send: (invitationData) => {
    return api.post('/invitations/email', invitationData);
  }
};

// Services d'administration
export const adminService = {
  // Authentification admin
  login: (credentials) => api.post('/admin/auth/login', credentials),
  
  // Gestion des duels
  duels: {
    getAll: (params = {}) => {
      const token = localStorage.getItem('adminToken');
      return api.get('/admin/duels', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    getStatistiques: () => {
      const token = localStorage.getItem('adminToken');
      return api.get('/admin/duels/statistiques', {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    supprimer: (id, raison) => {
      const token = localStorage.getItem('adminToken');
      return api.delete(`/admin/duels/${id}`, {
        data: { raison },
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    forcerValidation: (id, scoreData) => {
      const token = localStorage.getItem('adminToken');
      return api.put(`/admin/duels/${id}/forcer-validation`, scoreData, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  }
};

// Service d'upload
export const uploadService = {
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return api.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteAvatar: () => {
    return api.delete('/upload/avatar');
  }
};

export default api;