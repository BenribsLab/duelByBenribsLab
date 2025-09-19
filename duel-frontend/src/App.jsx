import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import Layout from './components/Layout';
import HomeWrapper from './components/HomeWrapper';
import Dashboard from './pages/Dashboard';
import Duels from './pages/Duels';
import Duellistes from './pages/Duellistes';
import Admin from './pages/Admin';
import AdminDuels from './components/AdminDuels';
import AdminInvitations from './pages/AdminInvitations';
import Parametres from './pages/Parametres';
import AdminLogin from './components/AdminLogin';
import Login from './pages/Login';
import Register from './pages/Register';
import './App.css'

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
        <Routes>
          {/* Route d'accueil publique */}
          <Route path="/" element={<HomeWrapper />} />
          
          {/* Routes publiques d'authentification */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Route d'administration (connexion) */}
          <Route path="/admin" element={<AdminLogin />} />
          
          {/* Routes d'administration protégées */}
          <Route path="/admin/dashboard" element={
            <AdminProtectedRoute>
              <Admin />
            </AdminProtectedRoute>
          } />
          
          <Route path="/admin/duels" element={
            <AdminProtectedRoute>
              <AdminDuels />
            </AdminProtectedRoute>
          } />
          
          <Route path="/admin/invitations" element={
            <AdminProtectedRoute>
              <AdminInvitations />
            </AdminProtectedRoute>
          } />
          
          {/* Routes utilisateurs protégées */}
          <Route path="/app" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="duels" element={<Duels />} />
            <Route path="duellistes" element={<Duellistes />} />
            <Route path="nouveau-duel" element={<Duels />} />
            <Route path="parametres" element={<Parametres />} />
          </Route>
          
          {/* Redirection pour compatibilité */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          <Route path="/duels" element={<Navigate to="/app/duels" replace />} />
          <Route path="/duellistes" element={<Navigate to="/app/duellistes" replace />} />
          <Route path="/nouveau-duel" element={<Navigate to="/app/nouveau-duel" replace />} />
          <Route path="/parametres" element={<Navigate to="/app/parametres" replace />} />
          
          {/* Route par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App
