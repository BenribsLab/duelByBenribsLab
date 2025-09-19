import { useState } from 'react';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';

const EmailInviteInput = ({ onInvite, placeholder = "email@exemple.com" }) => {
  const [email, setEmail] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null); // null, 'valid', 'invalid', 'exists'
  const [errorMessage, setErrorMessage] = useState('');

  // Validation email simple
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Gérer les changements dans l'input
  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setValidationStatus(null);
    setErrorMessage('');
    
    // Validation en temps réel
    if (value === '') {
      setValidationStatus(null);
    } else if (!validateEmail(value)) {
      setValidationStatus('invalid');
      setErrorMessage('Format email invalide');
    } else {
      setValidationStatus('valid');
      setErrorMessage('');
    }
  };

  // Gérer la soumission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || validationStatus !== 'valid') {
      return;
    }

    setIsValidating(true);
    setErrorMessage('');

    try {
      // TODO: Vérifier si l'email existe déjà dans la base
      // const response = await fetch(`/api/users/check-email?email=${encodeURIComponent(email)}`);
      // const data = await response.json();
      
      // Simulation temporaire
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simuler différents cas
      const testCases = {
        'existe@test.com': 'exists',
        'invalide@test.com': 'invalid',
        default: 'success'
      };
      
      const result = testCases[email.toLowerCase()] || testCases.default;
      
      if (result === 'exists') {
        setValidationStatus('exists');
        setErrorMessage('Cette personne est déjà inscrite. Utilisez la recherche rapide.');
      } else if (result === 'invalid') {
        setValidationStatus('invalid');
        setErrorMessage('Adresse email invalide ou domaine inexistant.');
      } else {
        setValidationStatus('valid');
        onInvite(email);
        setEmail('');
      }
    } catch (error) {
      setValidationStatus('invalid');
      setErrorMessage('Erreur lors de la validation de l\'email.');
    } finally {
      setIsValidating(false);
    }
  };

  // Couleurs selon le statut
  const getInputClasses = () => {
    const baseClasses = "w-full pl-10 pr-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    switch (validationStatus) {
      case 'valid':
        return `${baseClasses} border-green-300 focus:border-green-500 focus:ring-green-500`;
      case 'invalid':
      case 'exists':
        return `${baseClasses} border-red-300 focus:border-red-500 focus:ring-red-500`;
      default:
        return `${baseClasses} border-gray-300 focus:border-blue-500 focus:ring-blue-500`;
    }
  };

  const getIconColor = () => {
    switch (validationStatus) {
      case 'valid':
        return 'text-green-500';
      case 'invalid':
      case 'exists':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="email"
            value={email}
            onChange={handleEmailChange}
            placeholder={placeholder}
            disabled={isValidating}
            className={getInputClasses()}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {isValidating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            ) : validationStatus === 'valid' ? (
              <CheckCircle className={`h-4 w-4 ${getIconColor()}`} />
            ) : validationStatus === 'invalid' || validationStatus === 'exists' ? (
              <AlertCircle className={`h-4 w-4 ${getIconColor()}`} />
            ) : (
              <Mail className={`h-4 w-4 ${getIconColor()}`} />
            )}
          </div>
        </div>

        {/* Messages de validation */}
        {errorMessage && (
          <p className="text-sm text-red-600 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errorMessage}
          </p>
        )}

        {validationStatus === 'valid' && !errorMessage && (
          <p className="text-sm text-green-600 flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            Email valide - Cliquez pour envoyer l'invitation
          </p>
        )}

        {/* Bouton d'envoi */}
        {validationStatus === 'valid' && !errorMessage && (
          <button
            type="submit"
            disabled={isValidating}
            className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Envoi en cours...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Envoyer l'invitation
              </>
            )}
          </button>
        )}
      </form>

      {/* Aide */}
      <p className="text-xs text-gray-500">
        L'invitation sera envoyée par email avec un lien d'inscription.
      </p>
    </div>
  );
};

export default EmailInviteInput;