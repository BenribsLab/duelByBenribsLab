import { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Swords, Calendar, Check, X, Trophy, AlertCircle, Search, Mail, Users, ExternalLink } from 'lucide-react';
import { duelsService, duellistesService, invitationsService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import useBackButton from '../hooks/useBackButton';
import ScoreModal from '../components/ScoreModal';
import MemberSearchInput from '../components/MemberSearchInput';
import EmailInviteInput from '../components/EmailInviteInput';

const Duels = () => {
  const location = useLocation();
  const [duels, setDuels] = useState([]);
  const [duellistes, setDuellistes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Définir l'onglet actif en fonction de la route et des paramètres URL
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    const adversaireParam = urlParams.get('adversaire');
    
    // Si on vient de la route /nouveau-duel, aller directement au formulaire de création
    if (location.pathname === '/nouveau-duel') {
      return 'nouveau-duel';
    }
    
    // Si un adversaire est spécifié dans l'URL, aller directement au formulaire de création
    if (adversaireParam) {
      return 'nouveau-duel';
    }
    
    // Si un onglet est spécifié dans l'URL, l'utiliser
    if (tabParam && ['invitations-recues', 'mes-defis', 'duels-actifs', 'duels-recents'].includes(tabParam)) {
      return tabParam;
    }
    
    // Par défaut, commencer par les invitations
    return 'invitations-recues';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [selectedDuel, setSelectedDuel] = useState(null);
  const { user } = useContext(AuthContext);

  // Gestion du bouton retour Android
  useBackButton({
    onBack: () => {
      // Si on est dans le formulaire nouveau-duel, revenir aux onglets
      if (activeTab === 'nouveau-duel') {
        setActiveTab('invitations-recues');
      } else {
        // Sinon utiliser le comportement par défaut (vers dashboard)
        navigate('/dashboard');
      }
    }
  });

  // Mettre à jour l'onglet actif quand la route ou les paramètres changent
  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname, location.search]);

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

  // Définition des onglets (sans nouveau-duel)
  const tabs = [
    { id: 'invitations-recues', label: 'Invitations Reçues', count: duels.filter(d => d.etat === 'PROPOSE' && d.adversaire.id === user?.id).length },
    { id: 'mes-defis', label: 'Mes Défis', count: duels.filter(d => d.etat === 'PROPOSE' && d.provocateur.id === user?.id).length },
    { id: 'duels-actifs', label: 'Duels Actifs', count: duels.filter(d => d.etat === 'A_JOUER').length },
    { id: 'duels-recents', label: 'Duels Récents', count: 0 }
  ];

  const currentTab = tabs.find(tab => tab.id === activeTab);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
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

  // Fonction pour obtenir le titre de la page
  const getPageTitle = () => {
    switch(activeTab) {
      case 'invitations-recues': return 'Invitations Reçues';
      case 'mes-defis': return 'Mes Défis';
      case 'duels-actifs': return 'Duels Actifs';
      case 'duels-recents': return 'Duels Récents';
      case 'nouveau-duel': return 'Provoquer un Duel';
      default: return 'Gestion des Duels';
    }
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
      {/* Header avec titre dynamique et bouton + */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getPageTitle()}
          </h1>
          <p className="text-gray-600 mt-1">Gérez vos défis et suivez vos combats</p>
        </div>
        
        {/* Bouton + flottant pour nouveau duel */}
        <button
          onClick={() => setActiveTab('nouveau-duel')}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-colors"
          aria-label="Nouveau duel"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Navigation par onglets - icônes uniquement */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            
            const getTabColor = () => {
              if (isActive) {
                switch(tab.id) {
                  case 'invitations-recues': return 'border-blue-500 text-blue-600';
                  case 'mes-defis': return 'border-red-500 text-red-600';
                  case 'duels-actifs': return 'border-purple-500 text-purple-600';
                  case 'duels-recents': return 'border-green-500 text-green-600';
                  default: return 'border-gray-500 text-gray-600';
                }
              }
              return 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
            };

            const getTabIcon = () => {
              const iconClass = `h-6 w-6 ${isActive ? '' : 'text-gray-400'}`;
              switch(tab.id) {
                case 'invitations-recues': return <AlertCircle className={iconClass} />;
                case 'mes-defis': return <Swords className={iconClass} />;
                case 'duels-actifs': return <Trophy className={iconClass} />;
                case 'duels-recents': return <Check className={iconClass} />;
                default: return null;
              }
            };

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 py-4 border-b-2 font-medium flex flex-col items-center justify-center relative ${getTabColor()}`}
              >
                {getTabIcon()}
                {tab.count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
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
                <div className="space-y-4">
                  {/* Contenu principal */}
                  <div>
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

                  {/* Séparateur visuel */}
                  <div className="border-t border-gray-200"></div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleAcceptDuel(duel.id)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accepter
                    </button>
                    <button
                      onClick={() => handleRefuseDuel(duel.id)}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <X className="h-4 w-4 mr-2" />
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
                <div className="space-y-4">
                  {/* Contenu principal */}
                  <div>
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

                  {/* Séparateur visuel */}
                  <div className="border-t border-gray-200"></div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    {duel.etat === 'PROPOSE' && (
                      <>
                        <button
                          onClick={() => handleAcceptDuel(duel.id)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Accepter
                        </button>
                        <button
                          onClick={() => handleRefuseDuel(duel.id)}
                          className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Refuser
                        </button>
                      </>
                    )}
                    
                    {duel.etat === 'A_JOUER' && (
                      <button 
                        onClick={() => handleOpenScoreModal(duel)}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Saisir le Résultat
                      </button>
                    )}

                    {duel.etat === 'PROPOSE_SCORE' && (
                      <button 
                        onClick={() => handleOpenScoreModal(duel)}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Voir Proposition
                      </button>
                    )}

                    {duel.etat === 'EN_ATTENTE_VALIDATION' && (
                      <div className="w-full flex items-center justify-center px-4 py-2 text-sm text-orange-600">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        En attente de validation
                      </div>
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

// Composant pour créer un nouveau duel avec 3 modes d'invitation
const NouveauDuelForm = ({ duellistes, onDuelCreated }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [activeAction, setActiveAction] = useState(null); // null, 'search', 'list', 'email'
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
      setActiveAction('search'); // Mode recherche si adversaire pré-sélectionné
    } else {
      setActiveAction(null); // Afficher les boutons de choix
    }
  }, [location.search]);

  const handleMemberSelected = (member) => {
    setFormData(prev => ({
      ...prev,
      adversaireId: member ? member.id : ''
    }));
  };

  const handleDuelSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const duelData = {
        provocateurId: user.id,
        adversaireId: parseInt(formData.adversaireId),
      };

      if (formData.notes.trim()) {
        duelData.notes = formData.notes.trim();
      }
      
      if (formData.dateProgrammee.trim()) {
        duelData.dateProgrammee = formData.dateProgrammee.trim();
      }

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

  const handleEmailInvite = async (inviteData) => {
    try {
      await invitationsService.send({
        email: inviteData.email,
        recipientName: inviteData.recipientName
      });
      // Le message de succès est géré par EmailInviteInput
    } catch (error) {
      // L'erreur est gérée par EmailInviteInput
      throw error;
    }
  };

  const actionButtons = [
    {
      id: 'search',
      label: 'Rechercher un membre',
      icon: Search,
      description: 'Trouvez un duelliste par son pseudo',
      color: 'blue'
    },
    {
      id: 'list',
      label: 'Choisir dans la liste',
      icon: Users,
      description: 'Parcourir tous les membres',
      color: 'green'
    },
    {
      id: 'email',
      label: 'Inviter par email',
      icon: Mail,
      description: 'Envoyer une invitation par email',
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Affichage des boutons d'action ou interface active */}
      {activeAction === null ? (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">Comment souhaitez-vous inviter ?</h3>
          
          <div className="grid grid-cols-1 gap-4">
            {actionButtons.map((action) => {
              const Icon = action.icon;
              const colorClasses = {
                blue: 'bg-blue-50 border-blue-200 hover:border-blue-300 hover:bg-blue-100',
                green: 'bg-green-50 border-green-200 hover:border-green-300 hover:bg-green-100',
                purple: 'bg-purple-50 border-purple-200 hover:border-purple-300 hover:bg-purple-100'
              };
              const iconColorClasses = {
                blue: 'text-blue-600',
                green: 'text-green-600',
                purple: 'text-purple-600'
              };
              
              return (
                <button
                  key={action.id}
                  onClick={() => setActiveAction(action.id)}
                  className={`p-6 rounded-xl border-2 transition-all text-left ${colorClasses[action.color]}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg bg-white shadow-sm`}>
                      <Icon className={`h-6 w-6 ${iconColorClasses[action.color]}`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg">
                        {action.label}
                      </div>
                      <div className="text-gray-600 text-sm mt-1">
                        {action.description}
                      </div>
                    </div>
                    <ExternalLink className="h-5 w-5 text-gray-400" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6">
          {/* Bouton retour */}
          <button
            onClick={() => setActiveAction(null)}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Retour aux options</span>
          </button>

          {/* Mode Recherche */}
          {activeAction === 'search' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <Search className="h-5 w-5 inline mr-2" />
                Rechercher un duelliste
              </h3>
              
              <div className="space-y-4">
                <MemberSearchInput
                  onMemberSelected={handleMemberSelected}
                  selectedMemberId={formData.adversaireId}
                />

                {formData.adversaireId && (
                  <form onSubmit={handleDuelSubmit} className="space-y-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message (optionnel)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        placeholder="Ajouter un message avec votre défi..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date souhaitée (optionnel)
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.dateProgrammee}
                        onChange={(e) => setFormData({ ...formData, dateProgrammee: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                    >
                      <Swords className="h-5 w-5" />
                      <span>{submitting ? 'Envoi...' : 'Envoyer le défi'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Mode Liste des duellistes */}
          {activeAction === 'list' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  <Users className="h-5 w-5 inline mr-2" />
                  Choisir un adversaire
                </h3>
                <button
                  onClick={() => navigate('/duellistes')}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  Voir la page complète
                </button>
              </div>
              
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {duellistes
                  .filter(dueliste => dueliste.id !== user.id)
                  .slice(0, 10) // Limiter à 10 pour la vue mobile
                  .map((dueliste) => (
                    <button
                      key={dueliste.id}
                      onClick={() => {
                        setFormData({ ...formData, adversaireId: dueliste.id });
                        setActiveAction('search'); // Revenir au mode recherche avec l'adversaire sélectionné
                      }}
                      className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{dueliste.pseudo}</div>
                          <div className="text-sm text-gray-500">
                            {dueliste.nbVictoires}V / {dueliste.nbDefaites}D
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {dueliste.points} pts
                          </div>
                          <div className="text-xs text-gray-500">
                            #{dueliste.position || '?'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Mode Invitation par email */}
          {activeAction === 'email' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                <Mail className="h-5 w-5 inline mr-2" />
                Inviter par email
              </h3>
              
              <EmailInviteInput onInviteSent={handleEmailInvite} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Duels;