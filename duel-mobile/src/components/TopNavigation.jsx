import { Swords, Trophy, Users, Calendar, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const TopNavigation = () => {
  const location = useLocation();

  const menuItems = [
    { icon: Trophy, label: 'Dashboard', path: '/dashboard' },
    { icon: Swords, label: 'Duels', path: '/duels' },
    { icon: Users, label: 'Duellistes', path: '/duellistes' },
    { icon: Calendar, label: 'Nouveau', path: '/nouveau-duel' },
    { icon: Settings, label: 'Paramètres', path: '/parametres' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50 pt-8">
      <div className="px-4 py-3">
        {/* Logo et titre */}
        <div className="flex items-center justify-center mb-3">
          <img src="/logo_cey_noir.png" alt="Cercle d'Escrime de Yerres" className="w-8 h-8 mr-2" />
          <h1 className="text-lg font-bold text-gray-900">Duel</h1>
        </div>
        
        {/* Navigation horizontale */}
        <div className="flex justify-between">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center px-2 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-4 w-4 mb-1 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                <span className="text-xs font-medium truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;