import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import pushNotificationService from './services/pushNotificationService';
import useBackButton from './hooks/useBackButton';

// Import des pages depuis le frontend
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Duels from './pages/Duels';
import Duellistes from './pages/Duellistes';
import Parametres from './pages/Parametres';

// Composants
import ProtectedRoute from './components/ProtectedRoute';
import MobileLayout from './components/MobileLayout';
import SplashScreen from './components/SplashScreen';

// Composant interne pour gérer la navigation
function AppContent() {
  const navigate = useNavigate();
  const { loading, isInitializing } = useAuth();

  // Gestion globale du bouton retour Android
  useBackButton({
    fallbackRoute: '/dashboard',
    preventExit: false
  });

  useEffect(() => {
    // Configurer la navigation pour les notifications push
    pushNotificationService.setNavigationCallback(navigate);
  }, [navigate]);

  // Afficher l'écran de chargement pendant l'initialisation
  if (loading || isInitializing) {
    return <SplashScreen />;
  }

  return (
    <div className="App min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          element={
            <ProtectedRoute>
              <MobileLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/duels" element={<Duels />} />
          <Route path="/nouveau-duel" element={<Duels />} />
          <Route path="/duellistes" element={<Duellistes />} />
          <Route path="/parametres" element={<Parametres />} />
        </Route>
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <AppContent />
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App
