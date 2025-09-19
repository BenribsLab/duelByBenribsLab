import { useState, useEffect, useContext } from 'react';
import { Trophy, Target, Calendar, Award, Swords } from 'lucide-react';
import { duellistesService, classementService } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';

const Duellistes = () => {
  const [duellistes, setDuellistes] = useState([]);
  const [classement, setClassement] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fonction pour défier un joueur
  const handleChallenge = (adversaireId) => {
    // Rediriger vers la page de nouveau duel avec l'adversaire pré-sélectionné
    navigate(`/app/nouveau-duel?adversaire=${adversaireId}`);
  };

  // Fonction pour obtenir le rang d'un duelliste
  const getRang = (duelisteId) => {
    const index = classement.findIndex(d => d.id === duelisteId);
    return index !== -1 ? index + 1 : null;
  };

  // Fonction pour obtenir la couleur du rang
  const getRangColor = (rang) => {
    if (!rang) return 'text-gray-500';
    if (rang === 1) return 'text-yellow-500'; // Or
    if (rang === 2) return 'text-gray-400'; // Argent
    if (rang === 3) return 'text-orange-600'; // Bronze
    return 'text-purple-600'; // Autres
  };

  // Fonction pour obtenir l'icône du rang
  const getRangIcon = (rang) => {
    if (!rang) return null;
    if (rang <= 3) return <Award className="h-4 w-4 mr-1" />;
    return null;
  };

  useEffect(() => {
    const fetchDuellistes = async () => {
      try {
        const [duellistesResponse, classementResponse] = await Promise.all([
          duellistesService.getAll(),
          classementService.get()
        ]);
        
        setDuellistes(duellistesResponse.data.data);
        setClassement(classementResponse.data.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des duellistes:', error);
      } finally {
        setLoading(false);
      }
    };

    // Chargement initial
    fetchDuellistes();

    // Refresh automatique toutes les 10 secondes
    const intervalId = setInterval(() => {
      fetchDuellistes();
    }, 10000); // 10 secondes

    // Cleanup: nettoyer l'interval quand le composant se démonte
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Duellistes</h1>
        <p className="text-gray-600">Tous les membres inscrits</p>
      </div>

      <div className="space-y-3">
        {duellistes.map((dueliste) => (
          <div key={dueliste.id} className="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar 
                src={dueliste.avatarUrl}
                pseudo={dueliste.pseudo}
                size="lg"
              />
            </div>
            
            {/* Infos joueur */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {dueliste.pseudo}
              </h3>
              <div className="flex items-center space-x-3 mt-1">
                {/* Victoires */}
                <div className="flex items-center text-green-600">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">{dueliste.nbVictoires}</span>
                </div>
                
                {/* Défaites */}
                <div className="flex items-center text-red-600">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">{dueliste.nbDefaites}</span>
                </div>
                
                {/* Points */}
                <div className="flex items-center text-blue-600">
                  <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">{dueliste.indiceTouches}</span>
                </div>
                
                {/* Rang */}
                {getRang(dueliste.id) && (
                  <div className={`flex items-center ${getRangColor(getRang(dueliste.id))}`}>
                    {getRangIcon(getRang(dueliste.id))}
                    <span className="text-sm font-medium">#{getRang(dueliste.id)}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Bouton défier */}
            <div className="flex-shrink-0">
              <button
                onClick={() => handleChallenge(dueliste.id)}
                disabled={dueliste.id === user?.id}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors"
              >
                <Swords className="h-4 w-4" />
                <span>{dueliste.id === user?.id ? 'Vous' : 'Défier'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {duellistes.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Aucun duelliste</h3>
          <p className="text-gray-500">Les membres du club apparaîtront ici.</p>
        </div>
      )}
    </div>
  );
};

export default Duellistes;