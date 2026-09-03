import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Swords, ShieldCheck, AlertCircle, Check, X } from 'lucide-react';
import axios from 'axios';
import config from '../config';

/**
 * Page publique atteinte via le lien envoyé au parent par e-mail. Le clic dans
 * l'e-mail amène ici (GET, sans effet) ; la décision elle-même n'est prise
 * qu'au clic sur un des deux boutons (POST), pour ne pas risquer qu'un
 * scanner anti-hameçonnage de messagerie déclenche l'action en préchargeant
 * le lien.
 */
const ConsentementParental = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // loading, ready, error, done
  const [info, setInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [decision, setDecision] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Lien invalide : jeton manquant.');
      return;
    }

    axios
      .get(`${config.API_BASE_URL}/parental-consent/parent/${encodeURIComponent(token)}`)
      .then((response) => {
        setInfo(response.data.data);
        setStatus('ready');
      })
      .catch((error) => {
        setErrorMessage(error.response?.data?.error || 'Ce lien est invalide ou a expiré.');
        setStatus('error');
      });
  }, [token]);

  const handleDecision = async (choix) => {
    setSubmitting(true);
    try {
      await axios.post(`${config.API_BASE_URL}/parental-consent/parent/${encodeURIComponent(token)}`, {
        decision: choix
      });
      setDecision(choix);
      setStatus('done');
    } catch (error) {
      setErrorMessage(error.response?.data?.error || 'Une erreur est survenue.');
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border p-8 space-y-6">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center justify-center">
            <Swords className="h-8 w-8 text-purple-600" />
          </Link>
          <h1 className="mt-3 text-xl font-bold text-gray-900">Autorisation parentale</h1>
        </div>

        {status === 'loading' && (
          <p className="text-center text-gray-500">Chargement...</p>
        )}

        {status === 'error' && (
          <div className="flex items-start bg-red-50 border border-red-200 rounded-md p-4">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {status === 'ready' && info && (
          <>
            <div className="flex items-start bg-blue-50 border border-blue-200 rounded-md p-4">
              <ShieldCheck className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900">
                <strong>{info.pseudo}</strong> souhaite créer un compte sur Duel By Benribs Lab
                (application de suivi de duels d'escrime) et vous a indiqué comme responsable légal.
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Le compte reste inactif tant que vous n'avez pas répondu. En cas d'accord, une dernière
              validation par un administrateur du club sera encore nécessaire avant activation.
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handleDecision('accept')}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4 mr-2" />
                J'autorise
              </button>
              <button
                type="button"
                onClick={() => handleDecision('reject')}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                <X className="h-4 w-4 mr-2" />
                Je refuse
              </button>
            </div>
          </>
        )}

        {status === 'done' && decision === 'accept' && (
          <p className="text-center text-sm text-gray-700">
            Merci. Votre accord a été enregistré. Un administrateur du club doit encore valider le
            compte avant qu'il ne devienne actif.
          </p>
        )}

        {status === 'done' && decision === 'reject' && (
          <p className="text-center text-sm text-gray-700">
            Votre refus a été enregistré. Le compte a été supprimé.
          </p>
        )}
      </div>
    </div>
  );
};

export default ConsentementParental;
