const authService = require('../services/authService');

class AuthController {
  // POST /api/auth/register
  async register(req, res) {
    try {
      const { pseudo, email, password, authMode, hasEmailAccess, categorie } = req.body;

      // Validation de base
      if (!pseudo) {
        return res.status(400).json({
          success: false,
          error: 'Le pseudo est requis'
        });
      }

      // Déterminer le mode d'authentification
      let finalAuthMode = authMode;
      if (!finalAuthMode) {
        finalAuthMode = hasEmailAccess && email ? 'OTP' : 'PASSWORD';
      }

      let result;

      if (finalAuthMode === 'OTP') {
        if (!email) {
          return res.status(400).json({
            success: false,
            error: 'L\'email est requis pour l\'authentification OTP'
          });
        }

              const result = await authService.registerWithOTP(pseudo, email, categorie);
        
        // TODO: Envoyer l'OTP par email via Microsoft Graph
        console.log(`OTP pour ${email}: ${result.otpCode}`);

        return res.status(201).json({
          success: true,
          message: 'Compte créé. Vérifiez votre email pour le code OTP.',
          data: {
            user: result.user,
            requiresOTP: true
          }
        });

      } else {
        if (!password) {
          return res.status(400).json({
            success: false,
            error: 'Le mot de passe est requis pour l\'authentification par mot de passe'
          });
        }

              const result = await authService.registerWithPassword(pseudo, password, email, categorie);

        return res.status(201).json({
          success: true,
          message: 'Compte créé avec succès',
          data: {
            user: result.user,
            token: result.token
          }
        });
      }

    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      
      return res.status(400).json({
        success: false,
        error: error.message || 'Erreur lors de la création du compte'
      });
    }
  }

  // POST /api/auth/login
  async login(req, res) {
    try {
      const { pseudo, email, password } = req.body;

      if (!pseudo && !email) {
        return res.status(400).json({
          success: false,
          error: 'Pseudo ou email requis'
        });
      }

      let result;

      if (password) {
        // Connexion avec mot de passe
        if (!pseudo) {
          return res.status(400).json({
            success: false,
            error: 'Pseudo requis pour la connexion avec mot de passe'
          });
        }

        result = await authService.loginWithPassword(pseudo, password);

        return res.status(200).json({
          success: true,
          message: 'Connexion réussie',
          data: {
            user: result.user,
            token: result.token
          }
        });

      } else {
        // Demande d'OTP
        if (!email) {
          return res.status(400).json({
            success: false,
            error: 'Email requis pour la connexion OTP'
          });
        }

        result = await authService.requestOTP(email);

        // TODO: Envoyer l'OTP par email via Microsoft Graph
        console.log(`OTP pour ${email}: ${result.otpCode}`);

        return res.status(200).json({
          success: true,
          message: 'Code OTP envoyé par email',
          data: {
            user: result.user,
            requiresOTP: true
          }
        });
      }

    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      
      return res.status(401).json({
        success: false,
        error: error.message || 'Erreur lors de la connexion'
      });
    }
  }

  // POST /api/auth/verify-otp
  async verifyOTP(req, res) {
    try {
      const { email, otpCode } = req.body;

      if (!email || !otpCode) {
        return res.status(400).json({
          success: false,
          error: 'Email et code OTP requis'
        });
      }

      const result = await authService.verifyOTP(email, otpCode);

      return res.status(200).json({
        success: true,
        message: 'Code OTP vérifié avec succès',
        data: {
          user: result.user,
          token: result.token
        }
      });

    } catch (error) {
      console.error('Erreur lors de la vérification OTP:', error);
      
      return res.status(401).json({
        success: false,
        error: error.message || 'Code OTP invalide'
      });
    }
  }

  // GET /api/auth/me
  async getProfile(req, res) {
    try {
      // L'utilisateur est déjà dans req.user grâce au middleware
      return res.status(200).json({
        success: true,
        data: {
          user: req.user
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération du profil'
      });
    }
  }

  // POST /api/auth/logout
  async logout(req, res) {
    try {
      // Avec JWT, le logout côté serveur est principalement informatif
      // Le vrai logout se fait côté client en supprimant le token
      
      return res.status(200).json({
        success: true,
        message: 'Déconnexion réussie'
      });

    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de la déconnexion'
      });
    }
  }
}

module.exports = new AuthController();