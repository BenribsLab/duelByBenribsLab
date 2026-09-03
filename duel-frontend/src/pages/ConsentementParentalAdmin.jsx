import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Swords, ShieldCheck, AlertCircle, Check, X } from 'lucide-react';
import axios from 'axios';
import config from '../config';

/**
 * Validation finale par un administrateur, via le lien reçu par e-mail une
 * fois le parent d'accord. Authorisation portée uniquement par le jeton signé
 * (pas de connexion admin nécessaire) — voir parentalConsentService côté API.
 * Même précaution que côté parent : le lien de l'e-mail n'exécute rien tant
 * qu'un bouton n'est pas cliqué sur cette page.
 */
const ConsentementParentalAdmin = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading');
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
      .get(`${config.API_BASE_URL}/parental-consent/admin/${encodeURIComponent(token)}`)
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
      await axios.post(`${config.API_BASE_URL}/parental-consent/admin/${encodeURIComponent(token)}`, {
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
          <h1 className="mt-3 text-xl font-bold text-gray-900">Validation administrateur</h1>
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
                Le parent (<strong>{info.parentEmail}</strong>) de <strong>{info.pseudo}</strong> a
                donné son accord. Validez pour activer le compte, ou refusez pour le supprimer.
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handleDecision('accept')}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                <Check className="h-4 w-4 mr-2" />
                Approuver
              </button>
              <button
                type="button"
                onClick={() => handleDecision('reject')}
                disabled={submitting}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                <X className="h-4 w-4 mr-2" />
                Rejeter
              </button>
            </div>
          </>
        )}

        {status === 'done' && decision === 'accept' && (
          <p className="text-center text-sm text-gray-700">Compte activé.</p>
        )}

        {status === 'done' && decision === 'reject' && (
          <p className="text-center text-sm text-gray-700">Compte supprimé.</p>
        )}
      </div>
    </div>
  );
};

export default ConsentementParentalAdmin;
