import React from 'react';
import { Link } from 'react-router-dom';
import { Swords, ArrowLeft } from 'lucide-react';

const Confidentialite = () => {
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
            <h1 className="text-3xl font-bold text-gray-900">Politique de confidentialité</h1>
            <p className="mt-2 text-sm text-gray-500">Dernière mise à jour : 3 septembre 2026</p>
          </div>

          <p className="text-gray-700">
            Duel By Benribs Lab (« l'application ») permet aux membres d'un club d'escrime de
            proposer des duels, suivre leurs résultats et consulter un classement. Cette page
            explique quelles données sont collectées, pourquoi, et comment les exercer.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Données collectées</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-700">
              <li><strong>Compte</strong> : pseudo, adresse e-mail (facultative), mot de passe (jamais stocké en clair) ou code de connexion à usage unique envoyé par e-mail.</li>
              <li><strong>Profil</strong> : avatar (image que vous téléversez), catégorie (junior/senior).</li>
              <li><strong>Activité</strong> : duels proposés, acceptés ou refusés, scores saisis, historique de victoires/défaites.</li>
              <li><strong>Notifications</strong> : un identifiant technique (jeton FCM) est enregistré sur votre appareil si vous activez les notifications, pour vous prévenir d'un nouveau duel ou résultat.</li>
              <li><strong>Invitations</strong> : si vous invitez un tiers par e-mail, son adresse et le statut de l'invitation (envoyée, ouverte, inscrite) sont conservés ; l'adresse IP associée est tronquée avant stockage.</li>
              <li><strong>Signalements</strong> : si vous signalez un message ou un comportement lié à un duel, le contenu de votre signalement est conservé et transmis à un administrateur pour examen.</li>
              <li><strong>Consentement parental</strong> : pour un compte Junior (moins de 15 ans), l'e-mail du parent ou responsable légal est collecté et utilisé uniquement pour lui demander son autorisation ; le compte reste inactif tant qu'elle n'a pas été donnée puis validée par un administrateur.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Pourquoi ces données</h2>
            <p className="text-gray-700">
              Uniquement pour faire fonctionner l'application : identifier votre compte, afficher
              le classement, organiser les duels, et vous notifier des événements qui vous
              concernent. Aucune donnée n'est vendue ni partagée à des fins publicitaires.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Partage avec des tiers</h2>
            <p className="text-gray-700">
              L'envoi d'e-mails (code de connexion, invitations) passe par Microsoft Graph
              (Microsoft 365). Les notifications passent par Firebase Cloud Messaging (Google).
              Ces prestataires traitent les données strictement nécessaires à l'envoi du message
              ou de la notification, pour notre compte.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Conservation</h2>
            <p className="text-gray-700">
              Les données sont conservées tant que votre compte existe. La suppression de votre
              compte est définitive et immédiate : profil, jetons de notification et intégralité
              de vos duels (y compris ceux joués contre d'autres membres) sont supprimés, sans
              période de rétention. Détails et marche à suivre sur la page{' '}
              <Link to="/suppression-compte" className="text-purple-600 hover:text-purple-700 font-medium">
                Suppression de compte
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Vos droits</h2>
            <p className="text-gray-700">
              Conformément au RGPD, vous pouvez demander l'accès, la rectification ou la
              suppression de vos données, ou leur portabilité, en écrivant à{' '}
              <a href="mailto:contact@benribs.fr" className="text-purple-600 hover:text-purple-700 font-medium">
                contact@benribs.fr
              </a>
              . Vous pouvez aussi modifier ou supprimer votre profil directement depuis les
              paramètres de votre compte.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Sécurité</h2>
            <p className="text-gray-700">
              Les mots de passe sont hachés (bcrypt), les codes de connexion sont chiffrés en
              base et expirent rapidement, et les échanges avec l'application sont protégés par
              HTTPS.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
            <p className="text-gray-700">
              Pour toute question sur cette politique :{' '}
              <a href="mailto:contact@benribs.fr" className="text-purple-600 hover:text-purple-700 font-medium">
                contact@benribs.fr
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Confidentialite;
