import { User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';
import Avatar from './Avatar';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fonction pour obtenir les initiales de l'utilisateur
  const getInitials = (pseudo) => {
    if (!pseudo) return 'U';
    return pseudo.slice(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Bienvenue{user?.pseudo ? `, ${user.pseudo}` : ''}
          </h2>
          <p className="text-sm text-gray-600">Gérez vos duels et suivez votre progression</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <NotificationDropdown />
          
          {/* Menu utilisateur */}
          <div className="relative">
            <div className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50">
              <Avatar 
                src={user?.avatarUrl}
                pseudo={user?.pseudo}
                size="sm"
              />
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">{user?.pseudo || 'Utilisateur'}</p>
                <p className="text-xs text-gray-500">
                  {user?.email ? user.email : 'Duelliste'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Bouton déconnexion */}
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-full transition-colors"
            title="Se déconnecter"
          >
            <LogOut className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;