import React, { useState, useEffect } from 'react';
import { Trophy, X, Check, Edit } from 'lucide-react';
import { duelsService } from '../services/api';

const ScoreModal = ({ duel, isOpen, onClose, onSubmit, currentUser }) => {
  const [scores, setScores] = useState({
    scoreProvocateur: '',
    scoreAdversaire: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [proposition, setProposition] = useState(null);
  const [mode, setMode] = useState('saisie'); // 'saisie', 'proposition', 'reponse'

  // Charger la proposition si le duel est en état PROPOSE_SCORE
  useEffect(() => {
    if (isOpen && duel && duel.etat === 'PROPOSE_SCORE' && !loading) {
      console.log('Chargement proposition pour duel:', duel.id);
      loadProposition();
    } else if (isOpen && !loading) {
      setMode('saisie');
      setProposition(null);
    }
  }, [isOpen, duel?.id, duel?.etat]); // Dépendances plus spécifiques

  const loadProposition = async () => {
    try {
      setLoading(true);
      const response = await duelsService.getProposition(duel.id, currentUser.id);
      console.log('Réponse proposition complète:', response);
      console.log('response.data:', response.data);
      console.log('Contenu complet de response.data:', JSON.stringify(response.data, null, 2));
      console.log('scoreProvocateur:', response.data.data.scoreProvocateur);
      console.log('scoreAdversaire:', response.data.data.scoreAdversaire);
      setProposition(response.data.data);
      
      if (response.data.data.aPropose) {
        setMode('proposition'); // L'utilisateur a proposé, il voit sa proposition
      } else {
        setMode('reponse'); // L'utilisateur voit la proposition de l'autre et peut répondre
        setScores({
          scoreProvocateur: response.data.data.scoreProvocateur?.toString() || '',
          scoreAdversaire: response.data.data.scoreAdversaire?.toString() || ''
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la proposition:', error);
      setError('Erreur lors du chargement de la proposition');
      setMode('saisie');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptProposition = async () => {
    try {
      setLoading(true);
      setError('');
      
      await duelsService.acceptProposition(duel.id, currentUser.id);
      onClose();
      // Recharger les duels
      if (onSubmit) {
        onSubmit(); // Utilisé pour recharger la liste
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors de l\'acceptation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitScore = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const scoreProvocateur = parseInt(scores.scoreProvocateur);
      const scoreAdversaire = parseInt(scores.scoreAdversaire);

      // Validation côté client
      if (isNaN(scoreProvocateur) || isNaN(scoreAdversaire)) {
        throw new Error('Les scores doivent être des nombres valides');
      }

      if (scoreProvocateur < 0 || scoreAdversaire < 0) {
        throw new Error('Les scores ne peuvent pas être négatifs');
      }

      if (scoreProvocateur === scoreAdversaire) {
        throw new Error('Les scores ne peuvent pas être égaux (pas de match nul)');
      }

      const response = await duelsService.validateScore(duel.id, {
        duelisteId: currentUser.id,
        scoreProvocateur,
        scoreAdversaire
      });

      // Reset form
      setScores({
        scoreProvocateur: '',
        scoreAdversaire: ''
      });
      
      onClose();
      
      // Recharger les duels
      if (onSubmit) {
        onSubmit();
      }
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Erreur lors de la saisie du score');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setScores(prev => ({
      ...prev,
      [field]: value
    }));
    setError(''); // Clear error when user types
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (loading && !proposition) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement...</p>
        </div>
      );
    }

    if (mode === 'proposition' && proposition) {
      // L'utilisateur voit sa propre proposition
      return (
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Votre proposition de score</h4>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600">{proposition.provocateur.pseudo}</div>
                <div className="text-2xl font-bold text-blue-600">{proposition.scoreProvocateur}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{proposition.adversaire.pseudo}</div>
                <div className="text-2xl font-bold text-blue-600">{proposition.scoreAdversaire}</div>
              </div>
            </div>
            <p className="text-sm text-blue-700 mt-2">En attente de validation par votre adversaire</p>
          </div>
        </div>
      );
    }

    if (mode === 'reponse' && proposition) {
      // L'utilisateur voit la proposition de l'autre et peut répondre
      return (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">
              Proposition de score de {proposition.proposePar.pseudo}
            </h4>
            <div className="grid grid-cols-2 gap-4 text-center mb-4">
              <div>
                <div className="text-sm text-gray-600">{proposition.provocateur.pseudo}</div>
                <div className="text-2xl font-bold text-yellow-600">{proposition.scoreProvocateur}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{proposition.adversaire.pseudo}</div>
                <div className="text-2xl font-bold text-yellow-600">{proposition.scoreAdversaire}</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAcceptProposition}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
              >
                <Check className="h-4 w-4 mr-2" />
                Accepter
              </button>
              <button
                type="button"
                onClick={() => setMode('saisie')}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Mode saisie (initial ou modification)
    return (
      <form onSubmit={handleSubmitScore} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {duel.provocateur.pseudo}
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={scores.scoreProvocateur}
              onChange={(e) => handleInputChange('scoreProvocateur', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {duel.adversaire.pseudo}
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={scores.scoreAdversaire}
              onChange={(e) => handleInputChange('scoreAdversaire', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Les scores doivent être entre 0 et 50. Pas de match nul autorisé.
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Validation...' : mode === 'saisie' && proposition ? 'Contre-proposer' : 'Valider'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
            {mode === 'proposition' ? 'Votre proposition' : 
             mode === 'reponse' ? 'Proposition reçue' : 'Saisir le résultat'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm font-medium text-gray-700 mb-2">Duel</div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">{duel.provocateur.pseudo}</span>
            <span className="text-gray-400">vs</span>
            <span className="font-semibold">{duel.adversaire.pseudo}</span>
          </div>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default ScoreModal;