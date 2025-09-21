import React from 'react';
import { Loader2 } from 'lucide-react';

const SplashScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src="/logo_cey.png" 
            alt="Duel Logo" 
            className="h-24 w-auto mx-auto"
          />
        </div>
        
        {/* Animation de chargement */}
        <div className="mb-6">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
        </div>
        
        {/* Texte de chargement */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-800">
            Démarrage de l'application
          </h2>
          <p className="text-sm text-gray-600">
            Vérification de votre session...
          </p>
        </div>
        
        {/* Barre de progression minimaliste */}
        <div className="mt-8 w-48 mx-auto">
          <div className="bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full animate-pulse"
              style={{
                width: '60%',
                animation: 'loading-bar 2s ease-in-out infinite'
              }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* Animation CSS personnalisée */}
      <style jsx>{`
        @keyframes loading-bar {
          0% { width: 20%; }
          50% { width: 80%; }
          100% { width: 20%; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;