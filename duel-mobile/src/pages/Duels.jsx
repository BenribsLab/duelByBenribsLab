import { useState, useEffect, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { Swords, Calendar, Check, X, Trophy, AlertCircle, ChevronDown } from 'lucide-react';
import { duelsService, duellistesService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import ScoreModal from '../components/ScoreModal';

const Duels = () => {
  const location = useLocation();
  const [duels, setDuels] = useState([]);
  const [duellistes, setDuellistes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Définir l'onglet actif en fonction de la route et des paramètres URL
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    
    // Si un onglet est spécifié dans l'URL, l'utiliser
    if (tabParam && ['invitations-recues', 'mes-defis', 'duels-actifs', 'duels-recents', 'nouveau-duel'].includes(tabParam)) {
      return tabParam;
    }
    
    // Sinon, utiliser la logique par défaut
    return location.pathname === '/app/nouveau-duel' ? 'nouveau-duel' : 'invitations-recues';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedDuel, setSelectedDuel] = useState(null);
  const { user } = useContext(AuthContext);

  // Gérer le responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize(); // Check initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mettre à jour l'onglet actif quand la route ou les paramètres changent
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname, location.search]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.relative')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) {
          console.error('Utilisateur non connecté');
          setLoading(false);
          return;
        }

        const [duelsResponse, duellistesResponse] = await Promise.all([
          duelsService.getMyDuels(user.id),
          duellistesService.getAll()
        ]);
        
        console.log('Duels récupérés pour utilisateur', user.id, ':', duelsResponse.data);
        setDuels(duelsResponse.data.data);
        setDuellistes(duellistesResponse.data.data);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    // Chargement initial
    fetchData();

    // Refresh automatique toutes les 10 secondes
    const intervalId = setInterval(() => {
      if (user?.id) {
        fetchData();
      }
    }, 10000); // 10 secondes

    // Cleanup: nettoyer l'interval quand le composant se démonte
    return () => {
      clearInterval(intervalId);
    };
  }, [user?.id]);

  // Définition des onglets
  const tabs = [
    { id: 'invitations-recues', label: 'Invitations Reçues', count: duels.filter(d => d.etat === 'PROPOSE' && d.adversaire.id === user?.id).length },
    { id: 'mes-defis', label: 'Mes Défis', count: duels.filter(d => d.etat === 'PROPOSE' && d.provocateur.id === user?.id).length },
    { id: 'duels-actifs', label: 'Duels Actifs', count: duels.filter(d => d.etat === 'A_JOUER').length },
    { id: 'duels-recents', label: 'Duels Récents', count: 0 },
    { id: 'nouveau-duel', label: 'Nouveau Défi', count: 0 }
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setDropdownOpen(false);
  };

  const handleAcceptDuel = async (duelId) => {
    try {
      await duelsService.accept(duelId, { adversaireId: user.id });
      // Recharger les données
      const duelsResponse = await duelsService.getMyDuels(user.id);
      setDuels(duelsResponse.data.data);
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
      alert('Erreur lors de l\'acceptation: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleRefuseDuel = async (duelId) => {
    try {
      await duelsService.refuse(duelId, { adversaireId: user.id });
      // Recharger les données
      const duelsResponse = await duelsService.getMyDuels(user.id);
      setDuels(duelsResponse.data.data);
    } catch (error) {
      console.error('Erreur lors du refus:', error);
      alert('Erreur lors du refus: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleOpenScoreModal = (duel) => {
    setSelectedDuel(duel);
    setShowScoreModal(true);
  };

  const handleCloseScoreModal = () => {
    setShowScoreModal(false);
    setSelectedDuel(null);
  };

  const handleSubmitScore = async () => {
    try {
      // Recharger les duels après soumission
      const duelsResponse = await duelsService.getMyDuels(user.id);
      setDuels(duelsResponse.data.data);
    } catch (error) {
      console.error('Erreur lors du rechargement des duels:', error);
    }
  };

  // Fonctions de filtrage des duels
  const getInvitationsRecues = () => {
    return duels.filter(duel => 
      duel.adversaireId === user.id && duel.etat === 'PROPOSE'
    );
  };

  const getMesDefis = () => {
    return duels.filter(duel => 
      duel.provocateurId === user.id
    );
  };

  const getDuelsActifs = () => {
    return duels.filter(duel => 
      (duel.provocateurId === user.id || duel.adversaireId === user.id) &&
      ['ACCEPTE', 'A_JOUER', 'PROPOSE_SCORE', 'EN_ATTENTE_VALIDATION'].includes(duel.etat)
    );
  };

  const getDuelsRecents = () => {
    return duels
      .filter(duel => 
        (duel.provocateurId === user.id || duel.adversaireId === user.id) &&
        ['VALIDE', 'REFUSE', 'ANNULE'].includes(duel.etat)
      )
      .sort((a, b) => new Date(b.dateValidation || b.dateProposition) - new Date(a.dateValidation || a.dateProposition))
      .slice(0, 10);
  };

  const getStatusBadge = (etat) => {
    const styles = {
      'PROPOSE': 'bg-yellow-100 text-yellow-800',
      'ACCEPTE': 'bg-blue-100 text-blue-800',
      'A_JOUER': 'bg-purple-100 text-purple-800',
      'PROPOSE_SCORE': 'bg-yellow-100 text-yellow-800',
      'EN_ATTENTE_VALIDATION': 'bg-orange-100 text-orange-800',
      'VALIDE': 'bg-green-100 text-green-800',
      'REFUSE': 'bg-red-100 text-red-800',
      'ANNULE': 'bg-gray-100 text-gray-800'
    };

    const labels = {
      'PROPOSE': 'Proposé',
      'ACCEPTE': 'Accepté',
      'A_JOUER': 'À jouer',
      'PROPOSE_SCORE': 'Score proposé',
      'EN_ATTENTE_VALIDATION': 'En attente',
      'VALIDE': 'Terminé',
      'REFUSE': 'Refusé',
      'ANNULE': 'Annulé'
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[etat] || 'bg-gray-100 text-gray-800'}`}>
        {labels[etat] || etat}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Duels</h1>
        <p className="text-gray-600 mt-1">Gérez vos défis et suivez vos combats</p>
      </div>

        {/* Onglets */}
        <div className="border-b border-gray-200">
          {/* Version Desktop */}
          {!isMobile && (
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const getTabColor = () => {
                  switch(tab.id) {
                    case 'invitations-recues': return isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
                    case 'mes-defis': return isActive ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
                    case 'duels-actifs': return isActive ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
                    case 'duels-recents': return isActive ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
                    case 'nouveau-duel': return isActive ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
                    default: return 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
                  }
                };
                const getTabIcon = () => {
                  switch(tab.id) {
                    case 'invitations-recues': return <AlertCircle className="h-4 w-4 mr-2" />;
                    case 'mes-defis': return <Swords className="h-4 w-4 mr-2" />;
                    case 'duels-actifs': return <Trophy className="h-4 w-4 mr-2" />;
                    case 'duels-recents': return <Check className="h-4 w-4 mr-2" />;
                    case 'nouveau-duel': return <Calendar className="h-4 w-4 mr-2" />;
                    default: return null;
                  }
                };

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center whitespace-nowrap ${getTabColor()}`}
                  >
                    {getTabIcon()}
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="ml-2 bg-red-100 text-red-600 text-xs rounded-full px-2 py-1 min-w-[20px] flex items-center justify-center">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Version Mobile - Dropdown */}
          {isMobile && (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full py-3 px-4 flex items-center justify-between bg-white border border-gray-300 rounded-md shadow-sm text-left"
              >
                <div className="flex items-center">
                  {currentTab?.id === 'invitations-recues' && <AlertCircle className="h-4 w-4 mr-2 text-blue-600" />}
                  {currentTab?.id === 'mes-defis' && <Swords className="h-4 w-4 mr-2 text-red-600" />}
                  {currentTab?.id === 'duels-actifs' && <Trophy className="h-4 w-4 mr-2 text-purple-600" />}
                  {currentTab?.id === 'duels-recents' && <Check className="h-4 w-4 mr-2 text-green-600" />}
                  {currentTab?.id === 'nouveau-duel' && <Calendar className="h-4 w-4 mr-2 text-orange-600" />}
                  <span className="font-medium">{currentTab?.label}</span>
                  {currentTab?.count > 0 && (
                    <span className="ml-2 bg-red-100 text-red-600 text-xs rounded-full px-2 py-1">
                      {currentTab.count}
                    </span>
                  )}
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${dropdownOpen ? 'transform rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`w-full px-4 py-3 text-left flex items-center hover:bg-gray-50 ${
                          isActive ? 'bg-gray-50 font-medium' : ''
                        }`}
                      >
                        {tab.id === 'invitations-recues' && <AlertCircle className="h-4 w-4 mr-3 text-blue-600" />}
                        {tab.id === 'mes-defis' && <Swords className="h-4 w-4 mr-3 text-red-600" />}
                        {tab.id === 'duels-actifs' && <Trophy className="h-4 w-4 mr-3 text-purple-600" />}
                        {tab.id === 'duels-recents' && <Check className="h-4 w-4 mr-3 text-green-600" />}
                        {tab.id === 'nouveau-duel' && <Calendar className="h-4 w-4 mr-3 text-orange-600" />}
                        <span className="flex-1">{tab.label}</span>
                        {tab.count > 0 && (
                          <span className="bg-red-100 text-red-600 text-xs rounded-full px-2 py-1 ml-2">
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contenu des onglets */}
      {activeTab === 'invitations-recues' && (
        <div className="space-y-4">
          {getInvitationsRecues().length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Aucune invitation</h3>
              <p className="text-gray-500">Vous n'avez pas d'invitations en attente.</p>
            </div>
          ) : (
            getInvitationsRecues().map((duel) => (
              <div key={duel.id} className="bg-white shadow rounded-lg p-6 border-l-4 border-yellow-400">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-900">
                          {duel.provocateur.pseudo}
                        </div>
                        <span className="text-gray-500">vous défie !</span>
                      </div>
                      {getStatusBadge(duel.etat)}
                    </div>

                    {duel.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Message :</strong> {duel.notes}
                      </div>
                    )}

                    {duel.dateProgrammee && (
                      <div className="mt-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Programmé le {new Date(duel.dateProgrammee).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptDuel(duel.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accepter
                    </button>
                    <button
                      onClick={() => handleRefuseDuel(duel.id)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Refuser
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'mes-defis' && (
        <div className="space-y-4">
          {getMesDefis().length === 0 ? (
            <div className="text-center py-12">
              <Swords className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Aucun défi</h3>
              <p className="text-gray-500">Vous n'avez lancé aucun défi.</p>
            </div>
          ) : (
            getMesDefis().map((duel) => (
              <div key={duel.id} className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-400">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-900">
                          Vous avez défié {duel.adversaire.pseudo}
                        </div>
                      </div>
                      {getStatusBadge(duel.etat)}
                    </div>

                    {duel.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Votre message :</strong> {duel.notes}
                      </div>
                    )}

                    {duel.dateProgrammee && (
                      <div className="mt-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Programmé le {new Date(duel.dateProgrammee).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {duel.etat === 'PROPOSE' && (
                      <span className="text-sm text-gray-600 italic">En attente de réponse...</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'duels-actifs' && (
        <div className="space-y-4">
          {getDuelsActifs().length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Aucun duel actif</h3>
              <p className="text-gray-500">Aucun duel en cours ou terminé.</p>
            </div>
          ) : (
            getDuelsActifs().map((duel) => (
              <div key={duel.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-900">
                          {duel.provocateur.pseudo}
                        </div>
                        <span className="text-gray-500">vs</span>
                        <div className="font-medium text-gray-900">
                          {duel.adversaire.pseudo}
                        </div>
                      </div>
                      {getStatusBadge(duel.etat)}
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-500">
                      Proposé le {new Date(duel.dateProposition).toLocaleDateString()}
                      {duel.dateProgrammee && (
                        <span> • Programmé le {new Date(duel.dateProgrammee).toLocaleDateString()}</span>
                      )}
                    </div>
                    
                    {duel.notes && (
                      <div className="mt-2 text-sm text-gray-600 italic">
                        "{duel.notes}"
                      </div>
                    )}

                    {/* Scores si disponibles */}
                    {duel.scoreProvocateur !== null && duel.scoreAdversaire !== null && (
                      <div className="mt-3 flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">
                            {duel.scoreProvocateur} - {duel.scoreAdversaire}
                          </span>
                          {duel.vainqueurId && (
                            <span className="text-xs text-green-600">
                              (Vainqueur: {duel.vainqueurId === duel.provocateurId ? duel.provocateur.pseudo : duel.adversaire.pseudo})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {duel.etat === 'PROPOSE' && (
                      <>
                        <button
                          onClick={() => handleAcceptDuel(duel.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accepter
                        </button>
                        <button
                          onClick={() => handleRefuseDuel(duel.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Refuser
                        </button>
                      </>
                    )}
                    
                    {duel.etat === 'A_JOUER' && (
                      <button 
                        onClick={() => handleOpenScoreModal(duel)}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Trophy className="h-4 w-4 mr-1" />
                        Saisir Résultat
                      </button>
                    )}

                    {duel.etat === 'PROPOSE_SCORE' && (
                      <button 
                        onClick={() => handleOpenScoreModal(duel)}
                        className="inline-flex items-center px-3 py-1 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        <Trophy className="h-4 w-4 mr-1" />
                        Voir Proposition
                      </button>
                    )}

                    {duel.etat === 'EN_ATTENTE_VALIDATION' && (
                      <span className="inline-flex items-center px-3 py-1 text-sm text-orange-600">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        En attente de validation
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'duels-recents' && (
        <div className="space-y-4">
          {getDuelsRecents().length === 0 ? (
            <div className="text-center py-12">
              <Check className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Aucun duel récent</h3>
              <p className="text-gray-500">Aucun duel terminé à afficher.</p>
            </div>
          ) : (
            getDuelsRecents().map((duel) => (
              <div key={duel.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-900">
                          {duel.provocateur.pseudo}
                        </div>
                        <span className="text-gray-500">vs</span>
                        <div className="font-medium text-gray-900">
                          {duel.adversaire.pseudo}
                        </div>
                      </div>
                      {getStatusBadge(duel.etat)}
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-500">
                      Proposé le {new Date(duel.dateProposition).toLocaleDateString()}
                      {duel.dateValidation && (
                        <span> • Terminé le {new Date(duel.dateValidation).toLocaleDateString()}</span>
                      )}
                    </div>
                    
                    {duel.notes && (
                      <div className="mt-2 text-sm text-gray-600 italic">
                        "{duel.notes}"
                      </div>
                    )}

                    {/* Résultat du duel */}
                    {duel.etat === 'VALIDE' && duel.scoreProvocateur !== null && duel.scoreAdversaire !== null && (
                      <div className="mt-3 flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm font-medium">
                            {duel.scoreProvocateur} - {duel.scoreAdversaire}
                          </span>
                          {duel.vainqueurId && (
                            <span className="text-sm font-medium text-green-600">
                              🏆 {duel.vainqueurId === duel.provocateurId ? duel.provocateur.pseudo : duel.adversaire.pseudo} a gagné
                            </span>
                          )}
                          {!duel.vainqueurId && duel.scoreProvocateur === duel.scoreAdversaire && (
                            <span className="text-sm font-medium text-blue-600">
                              🤝 Match nul
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Affichage pour duels refusés ou annulés */}
                    {(duel.etat === 'REFUSE' || duel.etat === 'ANNULE') && (
                      <div className="mt-3 text-sm text-gray-500">
                        {duel.etat === 'REFUSE' ? '❌ Duel refusé' : '🚫 Duel annulé'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'nouveau-duel' && (
        <NouveauDuelForm duellistes={duellistes} onDuelCreated={() => {
          // Recharger les duels
          duelsService.getMyDuels(user.id).then(response => setDuels(response.data.data));
          setActiveTab('invitations-recues');
        }} />
      )}

      {/* Modal de saisie de score */}
      {showScoreModal && selectedDuel && (
        <ScoreModal
          duel={selectedDuel}
          isOpen={showScoreModal}
          onClose={handleCloseScoreModal}
          onSubmit={handleSubmitScore}
          currentUser={user}
        />
      )}
    </div>
  );
};

// Composant pour créer un nouveau duel
const NouveauDuelForm = ({ duellistes, onDuelCreated }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const [formData, setFormData] = useState({
    adversaireId: '',
    notes: '',
    dateProgrammee: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Pré-sélectionner l'adversaire depuis l'URL si présent
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const adversaireParam = urlParams.get('adversaire');
    
    if (adversaireParam) {
      setFormData(prev => ({
        ...prev,
        adversaireId: adversaireParam
      }));
    }
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const duelData = {
        provocateurId: user.id, // Ajouter l'ID de l'utilisateur connecté
        adversaireId: parseInt(formData.adversaireId),
      };

      // Ajouter les champs optionnels seulement s'ils ont une valeur
      if (formData.notes.trim()) {
        duelData.notes = formData.notes.trim();
      }
      
      if (formData.dateProgrammee.trim()) {
        duelData.dateProgrammee = formData.dateProgrammee.trim();
      }

      console.log('Création de duel avec les données:', duelData);
      await duelsService.create(duelData);
      setFormData({ adversaireId: '', notes: '', dateProgrammee: '' });
      onDuelCreated();
    } catch (error) {
      console.error('Erreur lors de la création du duel:', error);
      alert('Erreur lors de la création du duel: ' + (error.response?.data?.error || error.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Défier un adversaire</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="adversaire" className="block text-sm font-medium text-gray-700">
            Adversaire
          </label>
          <select
            id="adversaire"
            value={formData.adversaireId}
            onChange={(e) => setFormData({ ...formData, adversaireId: e.target.value })}
            required
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choisir un adversaire</option>
            {duellistes
              .filter(dueliste => dueliste.id !== user.id) // Filtrer l'utilisateur connecté
              .map((dueliste) => (
              <option key={dueliste.id} value={dueliste.id}>
                {dueliste.pseudo} ({dueliste.nbVictoires}V / {dueliste.nbDefaites}D)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Message (optionnel)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Ajouter un message avec votre défi..."
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Date souhaitée (optionnel)
          </label>
          <input
            type="datetime-local"
            id="date"
            value={formData.dateProgrammee}
            onChange={(e) => setFormData({ ...formData, dateProgrammee: e.target.value })}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !formData.adversaireId}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Envoi en cours...
              </>
            ) : (
              <>
                <Swords className="h-4 w-4 mr-2" />
                Lancer le Défi
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Duels;