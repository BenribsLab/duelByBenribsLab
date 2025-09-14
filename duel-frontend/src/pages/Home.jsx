import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Swords, 
  Trophy, 
  Users, 
  Target, 
  Star, 
  Medal, 
  ArrowRight,
  CheckCircle,
  Zap
} from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Swords className="h-8 w-8 text-purple-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">DuelArena</span>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                S'inscrire
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              L'arène des
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                {" "}duellistes
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Défiez vos adversaires, grimpez dans les classements et devenez le champion ultime. 
              Un système de points équitable qui récompense la participation autant que la performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-purple-600 text-white hover:bg-purple-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center"
              >
                Commencer l'aventure
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/login"
                className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
              >
                J'ai déjà un compte
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600">
              Quatre étapes simples pour devenir un champion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Étape 1 */}
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">1. Créez votre profil</h3>
              <p className="text-gray-600">
                Inscrivez-vous et choisissez votre catégorie (Junior ou Senior)
              </p>
            </div>

            {/* Étape 2 */}
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">2. Lancez des défis</h3>
              <p className="text-gray-600">
                Proposez des duels à d'autres participants ou acceptez leurs invitations
              </p>
            </div>

            {/* Étape 3 */}
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Swords className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">3. Battez-vous</h3>
              <p className="text-gray-600">
                Affrontez vos adversaires et enregistrez les résultats de vos duels
              </p>
            </div>

            {/* Étape 4 */}
            <div className="text-center">
              <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">4. Grimpez au classement</h3>
              <p className="text-gray-600">
                Gagnez des points et montez dans le ranking de votre catégorie
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Système de points */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Système de points équitable
            </h2>
            <p className="text-xl text-purple-100">
              Nous récompensons à la fois la performance et la participation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-500 rounded-full w-12 h-12 flex items-center justify-center">
                    <Trophy className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">3 points pour une victoire</h3>
                    <p className="text-purple-100">Récompense la performance et l'excellence</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-blue-500 rounded-full w-12 h-12 flex items-center justify-center">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">1 point pour une défaite</h3>
                    <p className="text-purple-100">Encourage la participation et l'apprentissage</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="bg-green-500 rounded-full w-12 h-12 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Indice de touches</h3>
                    <p className="text-purple-100">Différentiel pour départager les égalités</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-8 backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-4">Pourquoi ce système ?</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-300 mt-1 flex-shrink-0" />
                  <span>Encourage tous les participants à jouer régulièrement</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-300 mt-1 flex-shrink-0" />
                  <span>Valorise l'apprentissage autant que la victoire</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-300 mt-1 flex-shrink-0" />
                  <span>Classements séparés Junior et Senior pour plus d'équité</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-300 mt-1 flex-shrink-0" />
                  <span>Progression visible et motivante pour tous les niveaux</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Deux catégories, deux classements
            </h2>
            <p className="text-xl text-gray-600">
              Une compétition équitable adaptée à chaque tranche d'âge
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Catégorie Junior */}
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="bg-orange-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Medal className="h-10 w-10 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Catégorie Junior</h3>
              <p className="text-gray-600 mb-6">
                Pour les duellistes de <strong>moins de 15 ans</strong>
              </p>
              <ul className="text-left space-y-2 text-gray-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Classement dédié</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Même système de points</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Compétition équitable</span>
                </li>
              </ul>
            </div>

            {/* Catégorie Senior */}
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="bg-purple-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Catégorie Senior</h3>
              <p className="text-gray-600 mb-6">
                Pour les duellistes de <strong>15 ans et plus</strong>
              </p>
              <ul className="text-left space-y-2 text-gray-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Classement général</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Même système de points</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Compétition expérimentée</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Prêt à rejoindre l'arène ?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Créez votre compte maintenant et commencez votre ascension vers le sommet du classement !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-purple-600 text-white hover:bg-purple-700 px-8 py-4 rounded-lg text-lg font-semibold transition-colors flex items-center justify-center"
            >
              Créer mon compte
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="text-purple-600 hover:text-purple-700 px-8 py-4 text-lg font-semibold"
            >
              J'ai déjà un compte
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Swords className="h-8 w-8 text-purple-400" />
              <span className="ml-2 text-xl font-bold">DuelArena</span>
            </div>
            <p className="text-gray-400">
              L'arène ultime des duellistes. Que le meilleur gagne !
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;