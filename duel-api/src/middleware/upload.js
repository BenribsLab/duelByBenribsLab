const multer = require('multer');
const path = require('path');
const fs = require('fs');

const avatarsDir = path.join(__dirname, '../../uploads/avatars');
fs.mkdirSync(avatarsDir, { recursive: true, mode: 0o750 });

const allowedMimeTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, callback) => {
    callback(allowedMimeTypes.has(file.mimetype) ? null : new Error('Type de fichier non autorisé'), true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
    fields: 0,
    // `files` et `fields` bornent déjà exactement ce qui est autorisé (un
    // fichier, aucun champ). `parts: 1` était redondant et cassait tout envoi
    // légitime : busboy compte 2 parts pour un seul fichier (off-by-one).
    parts: 2
  }
});

function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return { extension: '.jpg', mime: 'image/jpeg' };
  if (buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return { extension: '.png', mime: 'image/png' };
  const gif = buffer.subarray(0, 6).toString('ascii');
  if (gif === 'GIF87a' || gif === 'GIF89a') return { extension: '.gif', mime: 'image/gif' };
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { extension: '.webp', mime: 'image/webp' };
  }
  return null;
}

function handleUploadError(error, _req, res, next) {
  if (error instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: 'Fichier trop volumineux. Taille maximale autorisée : 5 Mo.',
      LIMIT_FILE_COUNT: 'Un seul fichier est autorisé.',
      LIMIT_UNEXPECTED_FILE: 'Champ de fichier inattendu.',
      LIMIT_FIELD_COUNT: 'Aucun champ supplémentaire n’est autorisé.',
      LIMIT_PART_COUNT: 'Requête multipart invalide.'
    };
    return res.status(400).json({ success: false, error: messages[error.code] || 'Upload invalide' });
  }
  if (error && error.message === 'Type de fichier non autorisé') {
    return res.status(400).json({ success: false, error: error.message });
  }
  return next(error);
}

function deleteAvatarFile(filename) {
  if (!filename || path.basename(filename) !== filename) return;
  const filePath = path.join(avatarsDir, filename);
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('Erreur suppression avatar:', error.message);
  }
}

function getAvatarUrl(filename) {
  return filename ? `/uploads/avatars/${filename}` : null;
}

function getFilenameFromUrl(avatarUrl) {
  if (!avatarUrl || !avatarUrl.startsWith('/uploads/avatars/')) return null;
  const filename = avatarUrl.slice('/uploads/avatars/'.length);
  return path.basename(filename) === filename ? filename : null;
}

module.exports = {
  upload: upload.single('avatar'),
  handleUploadError,
  detectImageType,
  deleteAvatarFile,
  getAvatarUrl,
  getFilenameFromUrl,
  avatarsDir
};
