import { useState, useEffect, useContext } from 'react';
import { Trophy, Target, Calendar, Award } from 'lucide-react';
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
        <p className="text-gray-600">Tous les membres du club d'escrime</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {duellistes.map((dueliste) => (
          <div key={dueliste.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              {/* Avatar et nom - Ligne principale */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <Avatar 
                    src={dueliste.avatarUrl}
                    pseudo={dueliste.pseudo}
                    size="xl"
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{dueliste.pseudo}</h3>
                <p className="text-sm text-gray-500">
                  Membre depuis {new Date(dueliste.dateInscription).toLocaleDateString()}
                </p>
              </div>

              {/* Statistiques en grille */}
              <div className="mb-6">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Victoires</dt>
                    <dd className="mt-1 text-lg font-semibold text-green-600">{dueliste.nbVictoires}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Défaites</dt>
                    <dd className="mt-1 text-lg font-semibold text-red-600">{dueliste.nbDefaites}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Points totaux</dt>
                    <dd className="mt-1 text-lg font-semibold text-blue-600">{dueliste.indiceTouches}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Rang</dt>
                    <dd className={`mt-1 text-lg font-semibold flex items-center ${getRangColor(getRang(dueliste.id))}`}>
                      {getRangIcon(getRang(dueliste.id))}
                      {getRang(dueliste.id) ? `#${getRang(dueliste.id)}` : 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <Target className="h-4 w-4 mr-1" />
                  Ratio: {dueliste.nbMatchsTotal > 0 
                    ? `${Math.round((dueliste.nbVictoires / dueliste.nbMatchsTotal) * 100)}%`
                    : '0%'
                  }
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Trophy className="h-4 w-4 mr-1" />
                  Cat.: {dueliste.categorie}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  dueliste.statut === 'ACTIF' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {dueliste.statut}
                </span>
                
                <button 
                  onClick={() => handleChallenge(dueliste.id)}
                  disabled={dueliste.id === user?.id}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trophy className="h-4 w-4 mr-1" />
                  {dueliste.id === user?.id ? 'Vous' : 'Défier'}
                </button>
              </div>
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