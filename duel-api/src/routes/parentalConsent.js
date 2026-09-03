const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { handleValidation } = require('../middleware/validation');
const { reportLimiter } = require('../middleware/securityRateLimits');
const parentalConsentService = require('../services/parentalConsentService');

// Routes publiques : l'autorisation ne repose pas sur une session (ni le
// parent ni l'admin ne se connectent), mais sur le jeton signé reçu par
// e-mail — même modèle que les liens de suivi d'invitation.

const validateToken = [
  param('token').isString().isLength({ min: 10, max: 256 }),
  handleValidation
];

const validateDecision = [
  ...validateToken,
  body('decision').isIn(['accept', 'reject']).withMessage('Décision invalide'),
  handleValidation
];

function handleError(res, error) {
  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status < 500 ? error.message : 'Erreur serveur';
  return res.status(status).json({ success: false, error: message });
}

router.get('/parent/:token', validateToken, async (req, res) => {
  try {
    const info = await parentalConsentService.getDecisionInfo(req.params.token, 'parent');
    res.json({ success: true, data: info });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/parent/:token', reportLimiter, validateDecision, async (req, res) => {
  try {
    const result = await parentalConsentService.decideAsParent(req.params.token, req.body.decision);
    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
});

router.get('/admin/:token', validateToken, async (req, res) => {
  try {
    const info = await parentalConsentService.getDecisionInfo(req.params.token, 'admin');
    res.json({ success: true, data: info });
  } catch (error) {
    handleError(res, error);
  }
});

router.post('/admin/:token', reportLimiter, validateDecision, async (req, res) => {
  try {
    const result = await parentalConsentService.decideAsAdmin(req.params.token, req.body.decision);
    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
