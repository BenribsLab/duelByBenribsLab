import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import Avatar from './Avatar';

const MemberSearchInput = ({ duellistes, onSelect, currentUserId, placeholder = "Rechercher un duelliste..." }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filtrer les duellistes selon la recherche
  const filteredDuellistes = duellistes
    .filter(dueliste => dueliste.id !== currentUserId) // Exclure l'utilisateur connecté
    .filter(dueliste => 
      dueliste.pseudo.toLowerCase().includes(query.toLowerCase()) ||
      (dueliste.nom && dueliste.nom.toLowerCase().includes(query.toLowerCase())) ||
      (dueliste.prenom && dueliste.prenom.toLowerCase().includes(query.toLowerCase()))
    )
    .slice(0, 5); // Limiter à 5 résultats

  // Gérer la sélection avec le clavier
  const handleKeyDown = (e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredDuellistes.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && filteredDuellistes[selectedIndex]) {
          handleSelect(filteredDuellistes[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Gérer la sélection d'un duelliste
  const handleSelect = (dueliste) => {
    setQuery(dueliste.pseudo);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSelect(dueliste);
  };

  // Gérer les changements dans l'input
  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length > 0);
    setSelectedIndex(-1);
    
    // Si on efface complètement, notifier la déselection
    if (value === '') {
      onSelect(null);
    }
  };

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current && !inputRef.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              onSelect(null);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown des résultats */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {filteredDuellistes.length > 0 ? (
            filteredDuellistes.map((dueliste, index) => (
              <div
                key={dueliste.id}
                onClick={() => handleSelect(dueliste)}
                className={`px-4 py-3 cursor-pointer flex items-center space-x-3 ${
                  index === selectedIndex
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <Avatar
                  src={dueliste.avatarUrl}
                  pseudo={dueliste.pseudo}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {dueliste.pseudo}
                  </p>
                  <p className="text-xs text-gray-500">
                    {dueliste.nbVictoires}V / {dueliste.nbDefaites}D
                    {dueliste.nom && dueliste.prenom && (
                      <span className="ml-2">• {dueliste.prenom} {dueliste.nom}</span>
                    )}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500">
              Aucun duelliste trouvé pour "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberSearchInput;