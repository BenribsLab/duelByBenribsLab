import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Home from '../pages/Home';

const HomeWrapper = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Si l'utilisateur est connecté, rediriger vers le dashboard
    if (!loading && user) {
      navigate('/app/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Si on est en train de charger ou si l'utilisateur est connecté, 
  // ne pas afficher la page d'accueil
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (user) {
    return null; // La redirection est en cours
  }

  return <Home />;
};

export default HomeWrapper;