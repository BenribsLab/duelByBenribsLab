import { Swords, Trophy, Users, Calendar, Settings, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { icon: Trophy, label: 'Dashboard', path: '/dashboard' },
    { icon: Swords, label: 'Mes Duels', path: '/app/duels' },
    { icon: Users, label: 'Duellistes', path: '/app/duellistes' },
    { icon: Calendar, label: 'Nouveau Duel', path: '/app/nouveau-duel' },
    { icon: Settings, label: 'Paramètres', path: '/app/parametres' },
  ];

  return (
    <>
      {/* Bouton menu mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-md"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <div className="flex flex-col items-center space-y-3">
            <img src="/logo_cey.png" alt="Cercle d'Escrime de Yerres" className="w-full max-w-32 h-auto" />
            <div className="text-center">
              <h1 className="text-xl font-bold">Duel</h1>
              <a 
                href="https://benribs.fr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                By Benribs Lab
              </a>
            </div>
          </div>
        </div>
        
        <nav className="mt-8">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-600 text-white border-r-4 border-accent-400'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;