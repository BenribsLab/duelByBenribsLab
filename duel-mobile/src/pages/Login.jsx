import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import config from '../config';

const Login = () => {
  const [step, setStep] = useState(1); // 1: identifiant, 2: password ou OTP
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMode, setLoginMode] = useState(''); // 'password' ou 'otp'
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL de redirection après connexion
  const from = location.state?.from?.pathname || '/app/dashboard';

  // Étape 1: Vérifier l'identifiant et déterminer le mode de connexion
  const handleIdentifierSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const isEmail = identifier.includes('@');
      
      if (isEmail) {
        // Tentative de demande OTP via la route login existante
        const response = await axios.post(`${config.API_BASE_URL}/auth/login`, {
          email: identifier
          // Pas de password = demande OTP
        });
        
        if (response.data.success) {
          if (response.data.data.requiresOTP) {
            setLoginMode('otp');
            setStep(2);
          } else {
            // L'utilisateur a été connecté directement (cas peu probable sans password)
            login(response.data.data.user, response.data.data.token);
            navigate(from, { replace: true });
          }
        } else {
          setError(response.data.error || 'Erreur lors de la vérification de l\'email');
        }
      } else {
        // C'est un pseudo, passer à l'étape mot de passe
        setLoginMode('password');
        setStep(2);
      }
    } catch (error) {
      if (error.response?.status === 404 || error.response?.data?.error?.includes('non trouvé')) {
        // Email non trouvé, rediriger vers inscription
        setError('Cet email n\'est pas encore inscrit. Vous allez être redirigé vers l\'inscription...');
        setTimeout(() => {
          navigate('/register', { 
            state: { 
              prefilledEmail: identifier,
              message: 'Cet email n\'est pas encore inscrit. Créez votre compte !'
            }
          });
        }, 2000);
      } else {
        setError(error.response?.data?.error || 'Erreur lors de la vérification');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 2a: Connexion avec mot de passe (pour les pseudos)
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${config.API_BASE_URL}/auth/login`, {
        pseudo: identifier,
        password: password
      });
      
      if (response.data.success) {
        login(response.data.data.user, response.data.data.token);
        navigate(from, { replace: true });
      } else {
        setError(response.data.error || 'Pseudo ou mot de passe incorrect');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Pseudo ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  // Étape 2b: Vérification OTP (pour les emails)
  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${config.API_BASE_URL}/auth/verify-otp`, {
        email: identifier,
        otpCode: otpCode
      });
      
      if (response.data.success) {
        login(response.data.data.user, response.data.data.token);
        navigate(from, { replace: true });
      } else {
        setError(response.data.error || 'Code OTP invalide');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Code OTP invalide');
    } finally {
      setIsLoading(false);
    }
  };

  // Retour à l'étape 1
  const handleBackToStep1 = () => {
    setStep(1);
    setPassword('');
    setOtpCode('');
    setError('');
    setLoginMode('');
  };

  // Étape 1: Saisie de l'identifiant
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
              <LogIn className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Connexion
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Entrez votre email ou pseudo pour continuer
            </p>
            <div className="mt-4 text-center">
              <Link
                to="/"
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                ← Retour à l'accueil
              </Link>
            </div>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleIdentifierSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="identifier" className="sr-only">
                Email ou Pseudo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email ou pseudo"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !identifier.trim()}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Vérification...' : 'Continuer'}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  S'inscrire
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Étape 2a: Saisie du mot de passe (pour les pseudos)
  if (step === 2 && loginMode === 'password') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Mot de passe
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Entrez le mot de passe pour <strong>{identifier}</strong>
            </p>
            <div className="mt-4 text-center">
              <button
                onClick={handleBackToStep1}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                <ArrowLeft className="inline h-4 w-4 mr-1" />
                Modifier l'identifiant
              </button>
            </div>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p>{error}</p>
                {(error.includes('non trouvé') || error.includes('incorrecte') || error.includes('Utilisateur non trouvé')) && (
                  <p className="mt-2 text-sm">
                    Si vous n'avez pas encore de compte,{' '}
                    <Link to="/register" className="font-medium text-red-600 hover:text-red-500 underline">
                      créez-le ici
                    </Link>
                  </p>
                )}
              </div>
            )}
            
            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
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
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !password.trim()}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Étape 2b: Saisie du code OTP (pour les emails)
  if (step === 2 && loginMode === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Code de vérification
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Un code à 6 chiffres a été envoyé à<br />
              <strong>{identifier}</strong>
            </p>
            <div className="mt-4 text-center">
              <button
                onClick={handleBackToStep1}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                <ArrowLeft className="inline h-4 w-4 mr-1" />
                Modifier l'email
              </button>
            </div>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleOTPSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                <p>{error}</p>
                {(error.includes('non trouvé') || error.includes('incorrecte') || error.includes('Utilisateur non trouvé')) && (
                  <p className="mt-2 text-sm">
                    Si vous n'avez pas encore de compte,{' '}
                    <Link to="/register" className="font-medium text-red-600 hover:text-red-500 underline">
                      créez-le ici
                    </Link>
                  </p>
                )}
              </div>
            )}
            
            <div>
              <label htmlFor="otpCode" className="sr-only">
                Code OTP
              </label>
              <input
                id="otpCode"
                name="otpCode"
                type="text"
                maxLength="6"
                pattern="[0-9]{6}"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm text-center text-lg tracking-widest"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Vérification...' : 'Se connecter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default Login;