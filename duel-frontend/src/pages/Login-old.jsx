import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

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
        // Tentative d'envoi OTP pour l'email
        const response = await axios.post('http://localhost:3001/api/auth/request-otp', {
          email: identifier
        });
        
        if (response.data.success) {
          setLoginMode('otp');
          setStep(2);
        } else {
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
        }
      } else {
        // C'est un pseudo, passer à l'étape mot de passe
        setLoginMode('password');
        setStep(2);
      }
    } catch (error) {
      if (error.response?.status === 404) {
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
      
      if (response.data.success) {
        if (response.data.data && response.data.data.requiresOTP) {
          // L'utilisateur nécessite une vérification OTP
          // Stocker l'email pour l'étape OTP
          const isEmail = formData.identifier.includes('@');
          if (isEmail) {
            setOtpEmail(formData.identifier);
            setOtpStep(true);
          } else {
            setError('Veuillez utiliser votre adresse email pour la connexion OTP');
          }
        } else {
          // Connexion réussie avec mot de passe
          login(response.data.data.user, response.data.data.token);
          navigate(from, { replace: true });
        }
      } else {
        // Le serveur a retourné success: false
        setError(response.data.error || 'Erreur lors de la connexion');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Erreur lors de la connexion');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3001/api/auth/verify-otp', {
        email: otpEmail,
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

  if (otpStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Vérification OTP
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Un code à 6 chiffres a été envoyé à<br />
              <span className="font-medium">{otpEmail}</span>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleOTPVerification}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
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
                {isLoading ? 'Vérification...' : 'Vérifier le code'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setOtpStep(false);
                  setOtpCode('');
                  setError('');
                }}
                className="text-blue-600 hover:text-blue-500 text-sm"
              >
                ← Retour à la connexion
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
            Connectez-vous à votre compte Duel
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
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="identifier" className="sr-only">
                Pseudo ou Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {formData.identifier.includes('@') ? (
                    <Mail className="h-5 w-5 text-gray-400" />
                  ) : (
                    <User className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  className="appearance-none rounded-t-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Pseudo ou email"
                  value={formData.identifier}
                  onChange={handleInputChange}
                />
              </div>
            </div>
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
                  className="appearance-none rounded-b-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Mot de passe (optionnel pour email)"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !formData.identifier}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
              </span>
              {isLoading ? 'Connexion...' : 'Se connecter'}
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
};

export default Login;