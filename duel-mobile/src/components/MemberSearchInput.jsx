import React, { useState, useEffect, useRef } from 'react';
import { Search, User, CheckCircle2 } from 'lucide-react';
import { duellistesService } from '../services/api';

const MemberSearchInput = ({ onMemberSelected, disabled = false, selectedMemberId = null }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Charger le membre sélectionné si un ID est fourni
  useEffect(() => {
    if (selectedMemberId && !selectedMember) {
      loadSelectedMember(selectedMemberId);
    }
  }, [selectedMemberId, selectedMember]);

  const loadSelectedMember = async (memberId) => {
    try {
      const response = await duellistesService.getById(memberId);
      if (response.data.success) {
        const member = response.data.data;
        setSelectedMember(member);
        setQuery(member.pseudo);
      }
    } catch (error) {
      console.error('Erreur chargement membre:', error);
    }
  };

  const searchMembers = async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const response = await duellistesService.getAll();
      if (response.data.success) {
        const allMembers = response.data.data;
        
        // Filtrer par pseudo (insensible à la casse)
        const filtered = allMembers.filter(member =>
          member.pseudo.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        setResults(filtered.slice(0, 10)); // Limiter à 10 résultats
        setShowResults(true);
      }
    } catch (error) {
      console.error('Erreur recherche membres:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Réinitialiser la sélection si on change la recherche
    if (selectedMember && value !== selectedMember.pseudo) {
      setSelectedMember(null);
      onMemberSelected(null);
    }

    // Debounce pour éviter trop de requêtes
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchMembers(value);
    }, 300);
  };

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setQuery(member.pseudo);
    setShowResults(false);
    onMemberSelected(member);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    if (query.length >= 2 && results.length > 0) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Délai pour permettre le clic sur un résultat
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Rechercher un duelliste..."
          className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base ${
            selectedMember 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-300'
          }`}
          disabled={disabled}
          autoComplete="off"
        />
        {selectedMember && (
          <CheckCircle2 className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
        )}
        {loading && !selectedMember && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Résultats de recherche */}
      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.map((member) => (
            <button
              key={member.id}
              onClick={() => handleMemberSelect(member)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:bg-gray-50 focus:outline-none"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {member.pseudo}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {member.email}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Aucun résultat */}
      {showResults && query.length >= 2 && results.length === 0 && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <div className="text-center text-gray-500">
            <User className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucun duelliste trouvé pour "{query}"</p>
          </div>
        </div>
      )}

      {/* Information sur le membre sélectionné */}
      {selectedMember && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-sm text-green-700">
              <strong>{selectedMember.pseudo}</strong> sélectionné
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberSearchInput;