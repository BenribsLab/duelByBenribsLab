import { useState, useRef, useEffect } from 'react';
import { Bell, X, Clock, Swords, Trophy, CheckCircle, XCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obtenir l'icône selon le type de notification
  const getNotificationIcon = (type, notification) => {
    switch (type) {
      case 'invitation':
        return <Swords className="h-5 w-5 text-blue-500" />;
      case 'accepted':
        return <Trophy className="h-5 w-5 text-green-500" />;
      case 'score':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'finished':
        // Icône différente selon victoire/défaite
        const isVictory = notification.title === 'Victoire !';
        return isVictory 
          ? <CheckCircle className="h-5 w-5 text-green-600" />
          : <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Gérer le clic sur une notification
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    navigate(notification.link);
    setIsOpen(false);
  };

  // Formater le temps relatif
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton notification */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 transform translate-x-1 -translate-y-1"></span>
        )}
      </button>

      {/* Dropdown des notifications */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* En-tête */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {unreadCount}
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-500 font-medium"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Liste des notifications */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p>Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icône */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type, notification)}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {getTimeAgo(notification.timestamp)}
                        </p>
                      </div>

                      {/* Bouton fermer */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  navigate('/app/duels?tab=invitations-recues');
                  setIsOpen(false);
                }}
                className="w-full text-sm text-blue-600 hover:text-blue-500 font-medium text-center"
              >
                Voir tous les duels
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;