const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { handleValidation } = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

const {
  getAllDuellistes,
  getDuelisteById,
  updateDueliste,
  deleteDueliste,
  markNotificationsAsRead
} = require('../controllers/duellistesController');

// Validation middleware pour la mise à jour
const validateUpdateDueliste = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('L\'ID doit être un entier positif'),
  
  body('pseudo')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le pseudo doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-Z0-9\s.\-_]+$/)
    .withMessage('Le pseudo ne peut contenir que des lettres, chiffres, espaces, points, tirets et underscores'),
  
  // L'avatar est défini par POST /api/upload/avatar, qui génère lui-même le nom
  // du fichier. On n'accepte donc ici que le chemin interne renvoyé par l'API :
  // une URL libre ou une data URL permettrait de stocker du contenu arbitraire
  // et de faire charger une ressource tierce par le navigateur des visiteurs.
  body('avatarUrl')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === '') return true;
      if (!/^\/uploads\/avatars\/[A-Za-z0-9_-]+\.(jpg|png|gif|webp)$/.test(value)) {
        throw new Error('Avatar invalide : utilisez le téléversement d\'avatar');
      }
      return true;
    }),
  
  body('statut')
    .optional()
    .isIn(['ACTIF', 'INACTIF', 'SUSPENDU'])
    .withMessage('Le statut doit être ACTIF, INACTIF ou SUSPENDU'),
  
  body('categorie')
    .optional()
    .isIn(['JUNIOR', 'SENIOR'])
    .withMessage('La catégorie doit être JUNIOR ou SENIOR'),
  
  handleValidation
];

// Validation pour les paramètres de requête
const validateQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un entier positif'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
  
  query('statut')
    .optional()
    .isIn(['ACTIF', 'INACTIF', 'SUSPENDU'])
    .withMessage('Le statut doit être ACTIF, INACTIF ou SUSPENDU'),
  
  handleValidation
];

// Routes
router.get('/', authenticateToken, validateQuery, getAllDuellistes);
router.get('/:id', authenticateToken, param('id').isInt({ min: 1 }).withMessage('L\'ID doit être un entier positif'), handleValidation, getDuelisteById);
router.put('/:id', authenticateToken, validateUpdateDueliste, updateDueliste);
router.delete('/:id', authenticateToken, param('id').isInt({ min: 1 }).withMessage('L\'ID doit être un entier positif'), handleValidation, deleteDueliste);

// Route pour marquer les notifications comme consultées
router.put('/:id/notifications/mark-read', 
  authenticateToken, 
  param('id').isInt({ min: 1 }).withMessage('L\'ID doit être un entier positif'), 
  handleValidation, 
  markNotificationsAsRead
);

module.exports = router;
