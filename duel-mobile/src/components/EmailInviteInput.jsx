import React, { useState } from 'react';
import { Mail, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

const EmailInviteInput = ({ onInviteSent, disabled = false }) => {
  const [email, setEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' ou 'error'

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      showMessage('Veuillez saisir une adresse email', 'error');
      return;
    }

    if (!validateEmail(email)) {
      showMessage('Veuillez saisir une adresse email valide', 'error');
      return;
    }

    setSending(true);
    setMessage('');

    try {
      await onInviteSent({
        email: email.trim(),
        recipientName: recipientName.trim() || null
      });

      // Réinitialiser le formulaire
      setEmail('');
      setRecipientName('');
      showMessage('Invitation envoyée avec succès !', 'success');
    } catch (error) {
      console.error('Erreur envoi invitation:', error);
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'envoi de l\'invitation';
      showMessage(errorMessage, 'error');
    } finally {
      setSending(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Adresse email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="h-4 w-4 inline mr-2" />
            Adresse email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemple.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base"
            disabled={disabled || sending}
            autoComplete="email"
            autoCapitalize="none"
          />
        </div>

        {/* Nom du destinataire (optionnel) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom du destinataire (optionnel)
          </label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Prénom Nom"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-base"
            disabled={disabled || sending}
            autoComplete="name"
          />
        </div>

        {/* Message de retour */}
        {message && (
          <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            messageType === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {messageType === 'success' ? (
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Bouton d'envoi */}
        <button
          type="submit"
          disabled={disabled || sending || !email.trim()}
          className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-base transition-colors ${
            disabled || sending || !email.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
          }`}
        >
          {sending ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Envoi en cours...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Envoyer l'invitation
            </>
          )}
        </button>
      </form>

      {/* Informations */}
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          💡 La personne recevra un email avec un lien pour s'inscrire et rejoindre la communauté d'escrimeurs.
        </p>
      </div>
    </div>
  );
};

export default EmailInviteInput;