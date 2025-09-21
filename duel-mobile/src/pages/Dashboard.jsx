import { useState, useEffect, useContext } from 'react';
import { Trophy, Swords, Users, TrendingUp } from 'lucide-react';
import { classementService, duelsService } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const [classement, setClassement] = useState([]);
  const [classementComplet, setClassementComplet] = useState([]);
  const [classementJunior, setClassementJunior] = useState([]);
  const [duelsRecents, setDuelsRecents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Début du chargement des données...');
        console.log('Utilisateur connecté:', user);
        
        if (!user?.id) {
          console.error('Utilisateur non connecté ou ID manquant');
          setLoading(false);
          return;
        }
        
        const [classementResponse, classementJuniorResponse, duelsResponse] = await Promise.all([
          classementService.get(),
          classementService.getJunior(),
          duelsService.getMyDuels(user.id)
        ]);
        
        console.log('Classement response:', classementResponse);
        console.log('Classement Junior response:', classementJuniorResponse);
        console.log('Duels response:', duelsResponse);
        console.log('Classement data:', classementResponse.data);
        console.log('Classement Junior data:', classementJuniorResponse.data);
        console.log('Duels data:', duelsResponse.data);
        
        if (classementResponse.data && classementResponse.data.data) {
          setClassementComplet(classementResponse.data.data);
          setClassement(classementResponse.data.data.slice(0, 10));
          console.log('Classement complet set:', classementResponse.data.data);
          console.log('Classement top 10 set:', classementResponse.data.data.slice(0, 10));
        }
        
        if (classementJuniorResponse.data && classementJuniorResponse.data.data) {
          setClassementJunior(classementJuniorResponse.data.data.slice(0, 10));
          console.log('Classement Junior set:', classementJuniorResponse.data.data.slice(0, 10));
        }
        
        if (duelsResponse.data && duelsResponse.data.data) {
          setDuelsRecents(duelsResponse.data.data.slice(0, 5));
          console.log('Duels set:', duelsResponse.data.data.slice(0, 5));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
        console.log('Chargement terminé');
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

  // Fonction pour calculer le rang de l'utilisateur connecté
  const getMonRang = () => {
    if (!user?.id || !classementComplet.length) return 'N/A';
    
    const index = classementComplet.findIndex(dueliste => dueliste.id === user.id);
    return index !== -1 ? index + 1 : 'N/A';
  };

  // Fonction pour tronquer le pseudo si trop long
  const truncatePseudo = (pseudo) => {
    if (!pseudo) return '';
    return pseudo.length > 8 ? pseudo.substring(0, 7) + '...' : pseudo;
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
      {/* En-tête du dashboard */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-xl font-bold text-purple-600 mt-3">En garde, {user?.pseudo || user?.username || 'Utilisateur'} ! ⚔️</p>
      </div>

        {/* Statistiques rapides */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Total Duels */}
            <div className="flex flex-col items-center text-center space-y-1">
              <Trophy className="h-6 w-6 text-yellow-300" />
              <span className="text-xs sm:text-sm font-medium">
                <span className="hidden sm:inline">Total Duels</span>
                <span className="sm:hidden">Duels</span>
              </span>
              <span className="text-lg sm:text-xl font-bold">{duelsRecents.length}</span>
            </div>
            
            {/* En Cours */}
            <div className="flex flex-col items-center text-center space-y-1">
              <Swords className="h-6 w-6 text-red-300" />
              <span className="text-xs sm:text-sm font-medium">
                <span className="hidden sm:inline">En Cours</span>
                <span className="sm:hidden">Actifs</span>
              </span>
              <span className="text-lg sm:text-xl font-bold">{duelsRecents.filter(d => d.etat === 'A_JOUER').length}</span>
            </div>
            
            {/* Duellistes */}
            <div className="flex flex-col items-center text-center space-y-1">
              <Users className="h-6 w-6 text-green-300" />
              <span className="text-xs sm:text-sm font-medium">
                <span className="hidden sm:inline">Duellistes</span>
                <span className="sm:hidden">Joueurs</span>
              </span>
              <span className="text-lg sm:text-xl font-bold">{classement.length}</span>
            </div>
            
            {/* Mon Rang */}
            <div className="flex flex-col items-center text-center space-y-1">
              <TrendingUp className="h-6 w-6 text-orange-300" />
              <span className="text-xs sm:text-sm font-medium">
                <span className="hidden sm:inline">Mon Rang</span>
                <span className="sm:hidden">Rang</span>
              </span>
              <span className="text-lg sm:text-xl font-bold">#{getMonRang()}</span>
            </div>
          </div>
        </div>

      {/* Grille principale - Classements en haut */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Classement Général */}
        <div className="bg-white shadow-lg rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
              Top 10 Classement Général
            </h3>
            <div className="overflow-hidden">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">#</th>
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Pseudo</th>
                    <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">V/D</th>
                    <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">IND</th>
                    <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {classement.map((dueliste, index) => (
                    <tr key={dueliste.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-2 px-3 text-sm font-medium text-gray-900 whitespace-nowrap w-20">
                        {dueliste.pseudo && dueliste.pseudo.length > 8 
                          ? dueliste.pseudo.substring(0, 7) + '...' 
                          : dueliste.pseudo}
                      </td>
                      <td className="py-2 px-3 text-center text-sm text-gray-600">
                        <span className="text-green-600 font-medium">{dueliste.nbVictoires}</span>
                        /
                        <span className="text-red-600 font-medium">{dueliste.nbDefaites}</span>
                      </td>
                      <td className="py-2 px-3 text-center text-sm font-medium text-gray-900">
                        {dueliste.indiceTouches > 0 ? '+' : ''}{dueliste.indiceTouches || 0}
                      </td>
                      <td className="py-2 px-3 text-center text-sm font-bold text-gray-900">{dueliste.totalPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Classement Junior */}
        <div className="bg-white shadow-lg rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-orange-500" />
              Top 10 Classement Junior
            </h3>
            {classementJunior.length > 0 ? (
              <div className="overflow-hidden">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">#</th>
                      <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Pseudo</th>
                      <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider w-16">V/D</th>
                      <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">IND</th>
                      <th className="text-center py-2 px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {classementJunior.map((dueliste, index) => (
                      <tr key={dueliste.id} className="hover:bg-gray-50">
                        <td className="py-2 px-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            index === 0 ? 'bg-orange-500' :
                            index === 1 ? 'bg-orange-400' :
                            index === 2 ? 'bg-orange-300' : 'bg-orange-200 text-gray-700'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-sm font-medium text-gray-900 whitespace-nowrap w-20">
                          {dueliste.pseudo && dueliste.pseudo.length > 8 
                            ? dueliste.pseudo.substring(0, 7) + '...' 
                            : dueliste.pseudo}
                        </td>
                        <td className="py-2 px-3 text-center text-sm text-gray-600">
                          <span className="text-green-600 font-medium">{dueliste.nbVictoires}</span>
                          /
                          <span className="text-red-600 font-medium">{dueliste.nbDefaites}</span>
                        </td>
                        <td className="py-2 px-3 text-center text-sm font-medium text-gray-900">
                          {dueliste.indiceTouches > 0 ? '+' : ''}{dueliste.indiceTouches || 0}
                        </td>
                        <td className="py-2 px-3 text-center text-sm font-bold text-gray-900">{dueliste.totalPoints}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucun dueliste Junior pour le moment</p>
            )}
          </div>
        </div>
      </div>

      {/* Section Duels récents - En bas, pleine largeur */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center">
            <Swords className="h-5 w-5 mr-2 text-red-500" />
            Duels Récents
          </h3>
          <div className="space-y-3">
            {duelsRecents.map((duel) => (
              <div key={duel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {duel.provocateur.pseudo} vs {duel.adversaire.pseudo}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(duel.dateProposition).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    duel.etat === 'VALIDE' ? 'bg-green-100 text-green-800' :
                    duel.etat === 'A_JOUER' ? 'bg-blue-100 text-blue-800' :
                    duel.etat === 'PROPOSE' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {duel.etat === 'VALIDE' ? 'Terminé' :
                     duel.etat === 'A_JOUER' ? 'À jouer' :
                     duel.etat === 'PROPOSE' ? 'Proposé' : duel.etat}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;