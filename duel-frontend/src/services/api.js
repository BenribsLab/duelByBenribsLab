import axios from 'axios';
import config from '../config';

// Instance axios configurée
const api = axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Routes qui n'ont PAS besoin d'authentification
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/health'
];

// Intercepteur de requête - Ajoute automatiquement le token d'authentification
api.interceptors.request.use(
  (config) => {
    // Vérifier si cette route a besoin d'authentification
    const isPublicRoute = publicRoutes.some(route => 
      config.url && config.url.includes(route)
    );
    
    // Si ce n'est pas une route publique, ajouter le token
    if (!isPublicRoute) {
      let token;
      
      // Déterminer quel token utiliser selon la route
      if (config.url && config.url.includes('/admin/')) {
        // Routes admin - utiliser le token admin
        token = localStorage.getItem('admin_auth_token');
      } else {
        // Routes utilisateur normales - utiliser le token utilisateur
        token = localStorage.getItem('token');
      }
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse - Gère les erreurs d'authentification
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Rediriger vers la page de connexion si ce n'est pas déjà une route d'auth
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
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
  markNotificationsAsRead: (id) => api.put(`/duellistes/${id}/notifications/mark-read`),
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

// Services d'administration
export const adminService = {
  // Authentification admin
  login: (credentials) => api.post('/admin/auth/login', credentials),
  
  // Gestion des duels
  duels: {
    getAll: (params = {}) => {
      return api.get('/admin/duels', { params });
      // Authorization sera ajouté automatiquement par l'intercepteur
    },
    getStatistiques: () => {
      return api.get('/admin/duels/statistiques');
      // Authorization sera ajouté automatiquement par l'intercepteur
    },
    supprimer: (id, raison) => {
      return api.delete(`/admin/duels/${id}`, {
        data: { raison }
        // Authorization sera ajouté automatiquement par l'intercepteur
      });
    },
    forcerValidation: (id, scoreData) => {
      return api.put(`/admin/duels/${id}/forcer-validation`, scoreData);
      // Authorization sera ajouté automatiquement par l'intercepteur
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
        // Authorization sera ajouté automatiquement par l'intercepteur
      },
    });
  },
  deleteAvatar: () => {
    return api.delete('/upload/avatar');
    // Authorization sera ajouté automatiquement par l'intercepteur
  }
};

export default api;