const authService = require('../services/authService');

function errorResponse(res, error, fallback, defaultStatus = 400) {
  const status = Number.isInteger(error.status) ? error.status : defaultStatus;
  return res.status(status).json({ success: false, error: error.message || fallback });
}

class AuthController {
  async register(req, res) {
    try {
      const { pseudo, email, password, authMode, hasEmailAccess, categorie, parentEmail } = req.body;
      const finalAuthMode = authMode || (hasEmailAccess && email ? 'OTP' : 'PASSWORD');

      if (finalAuthMode === 'OTP') {
        if (!email) return res.status(400).json({ success: false, error: 'Email requis' });
        const result = await authService.registerWithOTP(pseudo, email, categorie, parentEmail);
        return res.status(201).json({
          success: true,
          message: result.requiresParentalConsent
            ? 'Compte créé. Vérifiez votre email pour le code OTP ; un e-mail a aussi été envoyé au parent renseigné.'
            : 'Compte créé. Vérifiez votre email pour le code OTP.',
          data: result
        });
      }

      if (!password) return res.status(400).json({ success: false, error: 'Mot de passe requis' });
      const result = await authService.registerWithPassword(pseudo, password, email, categorie, parentEmail);
      return res.status(201).json({
        success: true,
        message: result.requiresParentalConsent
          ? 'Compte créé. Un e-mail a été envoyé au parent renseigné pour autorisation.'
          : 'Compte créé avec succès',
        data: result
      });
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error.message);
      return errorResponse(res, error, 'Erreur lors de la création du compte');
    }
  }

  async login(req, res) {
    try {
      const { pseudo, email, password } = req.body;
      if (password) {
        const result = await authService.loginWithPassword(pseudo, password);
        return res.json({ success: true, message: 'Connexion réussie', data: result });
      }

      await authService.requestOTP(email);
      return res.json({
        success: true,
        message: 'Si ce compte existe, un code OTP a été envoyé.',
        data: { requiresOTP: true }
      });
    } catch (error) {
      console.error('Erreur lors de la connexion:', error.message);
      return errorResponse(res, error, 'Erreur lors de la connexion', 401);
    }
  }

  async verifyOTP(req, res) {
    try {
      const result = await authService.verifyOTP(req.body.email, req.body.otpCode);
      return res.json({ success: true, message: 'Code OTP vérifié avec succès', data: result });
    } catch (error) {
      return errorResponse(res, error, 'Code OTP invalide', 401);
    }
  }

  async getProfile(req, res) {
    return res.json({ success: true, data: { user: req.user } });
  }

  async logout(req, res) {
    try {
      await authService.logout(req.user.id);
      return res.json({ success: true, message: 'Déconnexion réussie' });
    } catch (error) {
      return errorResponse(res, error, 'Erreur lors de la déconnexion', 500);
    }
  }
}

module.exports = new AuthController();
