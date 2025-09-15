const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Créer le dossier uploads/avatars s'il n'existe pas
const uploadDir = path.join(__dirname, '../../uploads');
const avatarsDir = path.join(uploadDir, 'avatars');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    // Générer un nom de fichier unique
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const extension = path.extname(file.originalname).toLowerCase();
    const filename = `avatar_${timestamp}_${uniqueId}${extension}`;
    cb(null, filename);
  }
});

// Filtre pour valider les types de fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Seuls JPG, PNG, GIF et WebP sont acceptés.'), false);
  }
};

// Configuration de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1 // Un seul fichier à la fois
  }
});

// Middleware pour gérer les erreurs d'upload
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          success: false,
          error: 'Fichier trop volumineux. Taille maximale autorisée : 5MB.'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          success: false,
          error: 'Trop de fichiers. Un seul fichier autorisé.'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          success: false,
          error: 'Champ de fichier inattendu.'
        });
      default:
        return res.status(400).json({
          success: false,
          error: `Erreur d'upload: ${error.message}`
        });
    }
  }
  
  if (error.message.includes('Type de fichier non autorisé')) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
  
  next(error);
};

// Fonction utilitaire pour supprimer un fichier avatar
const deleteAvatarFile = (filename) => {
  if (!filename) return;
  
  try {
    const filePath = path.join(avatarsDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Avatar supprimé: ${filename}`);
    }
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'avatar ${filename}:`, error);
  }
};

// Fonction utilitaire pour obtenir l'URL publique d'un avatar
const getAvatarUrl = (filename) => {
  if (!filename) return null;
  return `/uploads/avatars/${filename}`;
};

// Fonction pour extraire le nom de fichier depuis une URL d'avatar
const getFilenameFromUrl = (avatarUrl) => {
  if (!avatarUrl || !avatarUrl.startsWith('/uploads/avatars/')) return null;
  return path.basename(avatarUrl);
};

module.exports = {
  upload: upload.single('avatar'),
  handleUploadError,
  deleteAvatarFile,
  getAvatarUrl,
  getFilenameFromUrl,
  avatarsDir
};