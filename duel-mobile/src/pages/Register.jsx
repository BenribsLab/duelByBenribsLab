import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import config from '../config';

const Register = () => {
  const [step, setStep] = useState(1); // 1: email access, 2: form, 3: OTP if needed
  const [hasEmailAccess, setHasEmailAccess] = useState(null);
  const [formData, setFormData] = useState({
    pseudo: '',
    email: '',
    password: '',
    confirmPassword: '',
    authMode: '',
    moinsDe15ans: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleEmailAccessChoice = (hasAccess) => {
    setHasEmailAccess(hasAccess);
    setFormData(prev => ({
      ...prev,
      authMode: hasAccess ? 'OTP' : 'PASSWORD'
    }));
    setStep(2);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validation des mots de passe si mode PASSWORD
      if (formData.authMode === 'PASSWORD') {
        if (formData.password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères');
          setIsLoading(false);
          return;
        }
        
        if (formData.password !== formData.confirmPassword) {
          setError('Les mots de passe ne correspondent pas');
          setIsLoading(false);
          return;
        }
      }

      const registrationData = {
        pseudo: formData.pseudo,
        authMode: formData.authMode,
        hasEmailAccess,
        categorie: formData.moinsDe15ans ? 'JUNIOR' : 'SENIOR'
      };

      if (formData.authMode === 'OTP') {
        registrationData.email = formData.email;
      } else {
        registrationData.password = formData.password;
        if (formData.email) {
          registrationData.email = formData.email;
        }
      }

      const response = await axios.post(`${config.API_BASE_URL}/auth/register`, registrationData);
      
      if (response.data.success) {
        if (response.data.data && response.data.data.requiresOTP) {
          setOtpStep(true);
        } else {
          // Inscription réussie avec mot de passe
          login(response.data.data.user, response.data.data.token);
          navigate('/dashboard');
        }
      } else {
        setError(response.data.error || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${config.API_BASE_URL}/auth/verify-otp`, {
        email: formData.email,
        otpCode: otpCode
      });

      if (response.data.success) {
        login(response.data.data.user, response.data.data.token);
        navigate('/dashboard');
      } else {
        setError(response.data.error || 'Code OTP invalide');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Code OTP invalide');
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 3: Vérification OTP
  if (otpStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Finaliser l'inscription
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Un code à 6 chiffres a été envoyé à<br />
              <span className="font-medium">{formData.email}</span>
            </p>
            <div className="mt-4 text-center">
              <Link
                to="/"
                className="text-purple-600 hover:text-purple-500 text-sm font-medium"
              >
                ← Retour à l'accueil
              </Link>
            </div>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleOTPVerification}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="otpCode" className="sr-only">
                Code de vérification
              </label>
              <input
                id="otpCode"
                name="otpCode"
                type="text"
                maxLength="6"
                pattern="[0-9]{6}"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm text-center text-lg tracking-widest"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Finalisation...' : 'Finaliser l\'inscription'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setOtpStep(false)}
                className="text-green-600 hover:text-green-500 text-sm"
              >
                Modifier les informations
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Étape 1: Question sur l'accès email
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-purple-100">
              <UserPlus className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Créer un compte
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Pour commencer, nous devons savoir comment vous configurer
            </p>
            <div className="mt-4 text-center">
              <Link
                to="/"
                className="text-purple-600 hover:text-purple-500 text-sm font-medium"
              >
                ← Retour à l'accueil
              </Link>
            </div>
          </div>
          
          <div className="mt-8 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800 mb-1">
                    Question importante
                  </h3>
                  <p className="text-sm text-blue-700">
                    Avez-vous accès à vos emails depuis la salle d'escrime ?
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleEmailAccessChoice(true)}
                className="w-full flex items-center justify-between p-4 border-2 border-green-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <div className="flex items-center">
                  <Wifi className="h-5 w-5 text-green-500 mr-3" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Oui, j'ai accès</div>
                    <div className="text-sm text-gray-500">Connexion par code email (plus sécurisé)</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleEmailAccessChoice(false)}
                className="w-full flex items-center justify-between p-4 border-2 border-orange-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
              >
                <div className="flex items-center">
                  <WifiOff className="h-5 w-5 text-orange-500 mr-3" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Non, pas d'accès</div>
                    <div className="text-sm text-gray-500">Connexion par mot de passe</div>
                  </div>
                </div>
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Déjà un compte ?{' '}
                <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
                  Se connecter
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Étape 2: Formulaire d'inscription
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-purple-100">
            <UserPlus className="h-6 w-6 text-purple-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Informations du compte
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Mode choisi: {' '}
            <span className={`font-medium ${hasEmailAccess ? 'text-green-600' : 'text-orange-600'}`}>
              {hasEmailAccess ? 'Connexion par email' : 'Connexion par mot de passe'}
            </span>
          </p>
          <div className="mt-4 text-center">
            <Link
              to="/"
              className="text-purple-600 hover:text-purple-500 text-sm font-medium"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Pseudo (toujours requis) */}
            <div>
              <label htmlFor="pseudo" className="block text-sm font-medium text-gray-700 mb-1">
                Pseudo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="pseudo"
                  name="pseudo"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="Votre pseudo d'escrime"
                  value={formData.pseudo}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
                {formData.authMode === 'OTP' && <span className="text-red-500"> *</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required={formData.authMode === 'OTP'}
                  className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  placeholder="votre.email@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              {formData.authMode === 'OTP' && (
                <p className="mt-1 text-xs text-gray-600">
                  Un code de vérification sera envoyé à cette adresse
                </p>
              )}
            </div>

            {/* Mot de passe (seulement si mode PASSWORD) */}
            {formData.authMode === 'PASSWORD' && (
              <>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="Minimum 6 caractères"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    Minimum 6 caractères
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le mot de passe <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      className="appearance-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      placeholder="Retapez votre mot de passe"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                    />
                  </div>
                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-1 text-xs text-red-600">
                      Les mots de passe ne correspondent pas
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Catégorie d'âge */}
            <div className="flex items-center">
              <input
                id="moinsDe15ans"
                name="moinsDe15ans"
                type="checkbox"
                checked={formData.moinsDe15ans}
                onChange={handleInputChange}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label htmlFor="moinsDe15ans" className="ml-2 block text-sm text-gray-700">
                Moins de 15 ans (catégorie Junior)
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !formData.pseudo || (formData.authMode === 'OTP' && !formData.email) || (formData.authMode === 'PASSWORD' && (!formData.password || !formData.confirmPassword || formData.password !== formData.confirmPassword))}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <UserPlus className="h-5 w-5 text-purple-500 group-hover:text-purple-400" />
              </span>
              {isLoading ? 'Création...' : 'Créer le compte'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              ← Changer le mode de connexion
            </button>
            
            <p className="text-sm text-gray-600">
              <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
                Se connecter
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;