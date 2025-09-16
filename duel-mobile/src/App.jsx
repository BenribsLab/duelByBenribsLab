import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

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

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <div className="App min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/duels" 
                element={
                  <ProtectedRoute>
                    <Duels />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/duellistes" 
                element={
                  <ProtectedRoute>
                    <Duellistes />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/parametres" 
                element={
                  <ProtectedRoute>
                    <Parametres />
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App
