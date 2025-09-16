import React, { useState, useEffect } from 'react';
import adminService from '../services/adminService';

const AdminDuels = () => {
  const [duels, setDuels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statistiques, setStatistiques] = useState(null);
  
  // Filtres et pagination
  const [filtres, setFiltres] = useState({
    page: 1,
    limit: 20,
    etat: '',
    search: ''
  });
  const [pagination, setPagination] = useState(null);
  
  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showForceModal, setShowForceModal] = useState(false);
  const [selectedDuel, setSelectedDuel] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [forceData, setForceData] = useState({
    scoreProvocateur: '',
    scoreAdversaire: '',
    raison: ''
  });

  // Charger les duels
  const chargerDuels = async () => {
    try {
      setLoading(true);
      const response = await adminService.duels.getAll(filtres);
      console.log('Réponse complète:', response);
      console.log('response.data:', response.data);
      setDuels(response.data.duels);
      setPagination(response.data.pagination);
      setError('');
    } catch (error) {
      console.error('Erreur chargement duels:', error);
      console.error('Message erreur:', error.message);
      setError('Erreur lors du chargement des duels');
    } finally {
      setLoading(false);
    }
  };

  // Charger les statistiques
  const chargerStatistiques = async () => {
    try {
      const response = await adminService.duels.getStatistiques();
      setStatistiques(response.data);
    } catch (error) {
      console.error('Erreur statistiques:', error);
    }
  };

  useEffect(() => {
    chargerDuels();
    chargerStatistiques();
  }, [filtres]);

  // Gestion des filtres
  const handleFiltreChange = (key, value) => {
    setFiltres(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset à la page 1 lors d'un changement de filtre
    }));
  };

  // Supprimer un duel
  const handleSupprimer = async (duelToDelete = null) => {
    console.log('handleSupprimer appelé !');
    const duel = duelToDelete || selectedDuel;
    if (!duel) {
      console.error('Aucun duel sélectionné');
      return;
    }
    
    try {
      console.log('Tentative suppression duel:', duel.id);
      await adminService.duels.supprimer(duel.id, 'Suppression admin');
      setSelectedDuel(null);
      chargerDuels();
      chargerStatistiques();
      alert('Duel supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression:', error);
      console.error('Détails erreur:', error.message);
      alert('Erreur lors de la suppression du duel: ' + error.message);
    }
  };

    // Forcer la validation
  const handleForcerValidation = async (duelToValidate = null, scores = null) => {
    console.log('handleForcerValidation appelé !');
    const duel = duelToValidate || selectedDuel;
    const data = scores || forceData;
    
    if (!duel) {
      console.error('Aucun duel sélectionné');
      return;
    }
    
    try {
      console.log('Tentative validation forcée duel:', duel.id, 'données:', data);
      await adminService.duels.forcerValidation(duel.id, data);
      setSelectedDuel(null);
      setForceData({ scoreProvocateur: '', scoreAdversaire: '', raison: '' });
      chargerDuels();
      chargerStatistiques();
      alert('Duel validé avec succès');
    } catch (error) {
      console.error('Erreur validation forcée:', error);
      console.error('Détails erreur:', error.message);
      alert('Erreur lors de la validation forcée: ' + error.message);
    }
  };

  // Formatage des dates
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  // Couleur selon l'état
  const getEtatColor = (etat) => {
    const colors = {
      'PROPOSE': 'bg-blue-100 text-blue-800',
      'ACCEPTE': 'bg-green-100 text-green-800',
      'A_JOUER': 'bg-yellow-100 text-yellow-800',
      'PROPOSE_SCORE': 'bg-orange-100 text-orange-800',
      'EN_ATTENTE_VALIDATION': 'bg-red-100 text-red-800',
      'VALIDE': 'bg-green-100 text-green-800'
    };
    return colors[etat] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Administration des Duels
        </h1>
        
        {statistiques && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Total</p>
              <p className="text-2xl font-bold text-blue-900">{statistiques.total}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600">Conflits</p>
              <p className="text-2xl font-bold text-red-900">{statistiques.conflits}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-orange-600">Propositions</p>
              <p className="text-2xl font-bold text-orange-900">{statistiques.propositions}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Validés</p>
              <p className="text-2xl font-bold text-green-900">{statistiques.parEtat?.VALIDE || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filtres */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              État
            </label>
            <select
              value={filtres.etat}
              onChange={(e) => handleFiltreChange('etat', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tous les états</option>
              <option value="PROPOSE">Proposé</option>
              <option value="ACCEPTE">Accepté</option>
              <option value="A_JOUER">À jouer</option>
              <option value="PROPOSE_SCORE">Score proposé</option>
              <option value="EN_ATTENTE_VALIDATION">En conflit</option>
              <option value="VALIDE">Validé</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche (pseudo)
            </label>
            <input
              type="text"
              value={filtres.search}
              onChange={(e) => handleFiltreChange('search', e.target.value)}
              placeholder="Chercher un joueur..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duels par page
            </label>
            <select
              value={filtres.limit}
              onChange={(e) => handleFiltreChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => setFiltres({ page: 1, limit: 20, etat: '', search: '' })}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste des duels */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joueurs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  État
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {duels.map((duel) => (
                <tr key={duel.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{duel.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="text-gray-900 font-medium">
                        {duel.provocateur.pseudo} vs {duel.adversaire.pseudo}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {duel.provocateur.email} | {duel.adversaire.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEtatColor(duel.etat)}`}>
                      {duel.etat}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {duel.scoreProvocateur !== null && duel.scoreAdversaire !== null 
                      ? `${duel.scoreProvocateur} - ${duel.scoreAdversaire}`
                      : '-'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(duel.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {duel.etat !== 'VALIDE' && (
                      <button
                        onClick={() => {
                          const scoreProvocateur = prompt(`Score de ${duel.provocateur.pseudo}:`);
                          const scoreAdversaire = prompt(`Score de ${duel.adversaire.pseudo}:`);
                          
                          if (scoreProvocateur !== null && scoreAdversaire !== null) {
                            const scores = {
                              scoreProvocateur: parseInt(scoreProvocateur) || 0,
                              scoreAdversaire: parseInt(scoreAdversaire) || 0,
                              raison: 'Validation forcée par admin'
                            };
                            handleForcerValidation(duel, scores);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        Forcer validation
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Êtes-vous sûr de vouloir supprimer le duel #${duel.id} entre ${duel.provocateur.pseudo} et ${duel.adversaire.pseudo} ?`)) {
                          console.log('Suppression confirmée pour duel:', duel.id);
                          handleSupprimer(duel);
                        }
                      }}
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handleFiltreChange('page', Math.max(1, filtres.page - 1))}
                disabled={filtres.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Précédent
              </button>
              <button
                onClick={() => handleFiltreChange('page', Math.min(pagination.pages, filtres.page + 1))}
                disabled={filtres.page >= pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Affichage de{' '}
                  <span className="font-medium">{(filtres.page - 1) * filtres.limit + 1}</span> à{' '}
                  <span className="font-medium">
                    {Math.min(filtres.page * filtres.limit, pagination.total)}
                  </span>{' '}
                  sur <span className="font-medium">{pagination.total}</span> résultats
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handleFiltreChange('page', Math.max(1, filtres.page - 1))}
                    disabled={filtres.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    Page {filtres.page} sur {pagination.pages}
                  </span>
                  <button
                    onClick={() => handleFiltreChange('page', Math.min(pagination.pages, filtres.page + 1))}
                    disabled={filtres.page >= pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-red-600 bg-opacity-90 overflow-y-auto h-full w-full z-50">
          {console.log('Modal de suppression rendu !', selectedDuel)}
          <div className="relative top-20 mx-auto p-5 border-4 border-black w-96 shadow-lg rounded-md bg-yellow-300">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Supprimer le duel #{selectedDuel?.id}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-4">
                  Êtes-vous sûr de vouloir supprimer ce duel entre{' '}
                  <strong>{selectedDuel?.provocateur.pseudo}</strong> et{' '}
                  <strong>{selectedDuel?.adversaire.pseudo}</strong> ?
                </p>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Raison de la suppression (optionnel)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedDuel(null);
                    setDeleteReason('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSupprimer}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de validation forcée */}
      {showForceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                Forcer la validation - Duel #{selectedDuel?.id}
              </h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  {selectedDuel?.provocateur.pseudo} vs {selectedDuel?.adversaire.pseudo}
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Score {selectedDuel?.provocateur.pseudo}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={forceData.scoreProvocateur}
                      onChange={(e) => setForceData(prev => ({...prev, scoreProvocateur: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Score {selectedDuel?.adversaire.pseudo}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={forceData.scoreAdversaire}
                      onChange={(e) => setForceData(prev => ({...prev, scoreAdversaire: e.target.value}))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Raison
                  </label>
                  <textarea
                    value={forceData.raison}
                    onChange={(e) => setForceData(prev => ({...prev, raison: e.target.value}))}
                    placeholder="Raison de la validation forcée"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
              </div>
              
              <div className="flex justify-center space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowForceModal(false);
                    setSelectedDuel(null);
                    setForceData({ scoreProvocateur: '', scoreAdversaire: '', raison: '' });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleForcerValidation}
                  disabled={!forceData.scoreProvocateur || !forceData.scoreAdversaire || forceData.scoreProvocateur === forceData.scoreAdversaire}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDuels;