import React from 'react';
import { Link } from 'react-router-dom';
import { Swords, ArrowLeft } from 'lucide-react';

const SuppressionCompte = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <Swords className="h-8 w-8 text-purple-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Duel By Benribs Lab</span>
            </Link>
            <Link
              to="/"
              className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Retour
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm border p-6 sm:p-10 space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Suppression de compte et de données</h1>
            <p className="mt-2 text-sm text-gray-500">Dernière mise à jour : 3 septembre 2026</p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Depuis l'application</h2>
            <p className="text-gray-700">
              Connectez-vous, puis rendez-vous dans <strong>Paramètres</strong>. Une section
              « Supprimer mon compte », en bas de page, permet de le faire vous-même,
              immédiatement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Sans accès à votre compte</h2>
            <p className="text-gray-700">
              Écrivez à{' '}
              <a href="mailto:contact@benribs.fr" className="text-purple-600 hover:text-purple-700 font-medium">
                contact@benribs.fr
              </a>{' '}
              depuis l'adresse e-mail associée à votre compte (ou en précisant votre pseudo), en
              indiquant que vous souhaitez la suppression de votre compte. La demande est traitée
              sous 30 jours.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Ce qui est supprimé</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li>Votre profil : pseudo, e-mail, mot de passe, avatar, catégorie.</li>
              <li>
                L'intégralité des duels auxquels vous avez participé — y compris ceux joués
                contre d'autres membres, qui disparaissent aussi de leur propre historique.
              </li>
              <li>Votre jeton de notifications push.</li>
              <li>Les invitations que vous avez envoyées.</li>
            </ul>
            <p className="text-gray-700">
              La suppression est <strong>impossible tant qu'un duel est en cours</strong> pour
              votre compte (proposé, accepté, ou en attente de validation du score) : annulez-le
              ou terminez-le d'abord.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Ce qui n'est pas supprimé</h2>
            <p className="text-gray-700">
              Rien n'est conservé après la suppression du compte : elle est immédiate et
              définitive, sans période de rétention.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SuppressionCompte;
