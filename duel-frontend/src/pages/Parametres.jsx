import React, { useState, useContext, useEffect } from 'react';
import { Settings, User, Save, AlertCircle, CheckCircle, Upload, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { duellistesService } from '../services/api';

const Parametres = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    pseudo: '',
    categorie: 'SENIOR',
    avatarUrl: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });
  const [initialData, setInitialData] = useState({});
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      const userData = {
        pseudo: user.pseudo || '',
        categorie: user.categorie || 'SENIOR',
        avatarUrl: user.avatarUrl || ''
      };
      setFormData(userData);
      setInitialData(userData);
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setMessage({ type: '', content: '' });
  };

  const hasChanges = () => {
    return formData.pseudo !== initialData.pseudo || 
           formData.categorie !== initialData.categorie ||
           formData.avatarUrl !== initialData.avatarUrl;
  };

  // Fonction pour convertir un fichier en base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Fonction pour gérer l'upload d'avatar
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', content: 'Veuillez sélectionner un fichier image.' });
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', content: 'L\'image ne doit pas dépasser 5MB.' });
      return;
    }

    try {
      setUploadingAvatar(true);
      setMessage({ type: '', content: '' });

      // Convertir en base64
      const base64 = await fileToBase64(file);
      
      // Mettre à jour le preview et les données du formulaire
      setAvatarPreview(base64);
      setFormData(prev => ({
        ...prev,
        avatarUrl: base64
      }));

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      setMessage({ type: 'error', content: 'Erreur lors du traitement de l\'image.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Fonction pour supprimer l'avatar
  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setFormData(prev => ({
      ...prev,
      avatarUrl: ''
    }));
    setMessage({ type: '', content: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasChanges()) {
      setMessage({ type: 'info', content: 'Aucune modification à sauvegarder.' });
      return;
    }

    setIsLoading(true);
    setMessage({ type: '', content: '' });

    try {
      const response = await duellistesService.update(user.id, formData);
      
      if (response.data.success) {
        // Mettre à jour le contexte utilisateur
        updateUser({ ...user, ...formData });
        setInitialData(formData);
        setMessage({ 
          type: 'success', 
          content: 'Paramètres mis à jour avec succès !' 
        });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      console.error('Détails de la réponse:', error.response?.data);
      console.error('Données envoyées:', formData);
      
      let errorMessage = 'Erreur lors de la mise à jour des paramètres.';
      
      // Si on a des détails de validation, les afficher
      if (error.response?.data?.details) {
        const details = error.response.data.details;
        errorMessage = details.map(d => `${d.field}: ${d.message}`).join(', ');
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      setMessage({ 
        type: 'error', 
        content: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData(initialData);
    setAvatarPreview(initialData.avatarUrl || null);
    setMessage({ type: '', content: '' });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Settings className="h-8 w-8 mr-3 text-purple-600" />
          Paramètres
        </h1>
        <p className="text-gray-600 mt-2">Gérez vos informations personnelles</p>
      </div>

      {/* Carte principale */}
      <div className="bg-white shadow-lg rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <User className="h-5 w-5 mr-2 text-gray-600" />
            Informations du compte
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Message de retour */}
          {message.content && (
            <div className={`p-4 rounded-md flex items-center ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              {message.content}
            </div>
          )}

          {/* Avatar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Photo de profil
            </label>
            
            <div className="flex items-start space-x-6">
              {/* Preview de l'avatar */}
              <div className="flex-shrink-0">
                {avatarPreview ? (
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="h-20 w-20 rounded-full object-cover border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-medium text-xl">
                      {formData.pseudo ? formData.pseudo.charAt(0).toUpperCase() : 'U'}
                    </span>
                  </div>
                )}
              </div>

              {/* Upload button */}
              <div className="flex-1">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50">
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingAvatar ? 'Traitement...' : 'Choisir une image'}
                  </div>
                </label>
                <p className="mt-2 text-sm text-gray-500">
                  JPG, PNG, GIF jusqu'à 5MB. Recommandé : 200x200px minimum.
                </p>
              </div>
            </div>
          </div>

          {/* Pseudo */}
          <div>
            <label htmlFor="pseudo" className="block text-sm font-medium text-gray-700 mb-2">
              Pseudo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="pseudo"
              name="pseudo"
              value={formData.pseudo}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="Votre pseudo"
            />
            <p className="mt-1 text-sm text-gray-500">
              Votre nom d'affichage visible par les autres duellistes
            </p>
          </div>

          {/* Catégorie */}
          <div>
            <label htmlFor="categorie" className="block text-sm font-medium text-gray-700 mb-2">
              Catégorie
            </label>
            <select
              id="categorie"
              name="categorie"
              value={formData.categorie}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="SENIOR">Senior</option>
              <option value="JUNIOR">Junior</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Votre catégorie d'âge pour les classements
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={resetForm}
              disabled={!hasChanges() || isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            
            <button
              type="submit"
              disabled={!hasChanges() || isLoading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>

      {/* Informations additionnelles */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">À propos des catégories :</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Junior :</strong> Pour les duellistes de moins de 15 ans</li>
              <li><strong>Senior :</strong> Pour les duellistes de 15 ans et plus</li>
              <li>Votre catégorie détermine dans quel classement vous apparaissez</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parametres;