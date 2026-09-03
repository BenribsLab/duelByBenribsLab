const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { prisma } = require('../database');
const {
  avatarsDir,
  detectImageType,
  deleteAvatarFile,
  getAvatarUrl,
  getFilenameFromUrl
} = require('../middleware/upload');

async function uploadAvatar(req, res) {
  let newFilename = null;
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Aucun fichier fourni' });

    const imageType = detectImageType(req.file.buffer);
    if (!imageType || imageType.mime !== req.file.mimetype) {
      return res.status(400).json({ success: false, error: 'Le contenu du fichier ne correspond pas à une image autorisée' });
    }

    const user = await prisma.dueliste.findUnique({
      where: { id: req.user.id },
      select: { avatarUrl: true }
    });
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });

    newFilename = `avatar_${crypto.randomBytes(24).toString('hex')}${imageType.extension}`;
    await fs.promises.writeFile(path.join(avatarsDir, newFilename), req.file.buffer, { flag: 'wx', mode: 0o640 });
    const avatarUrl = getAvatarUrl(newFilename);
    await prisma.dueliste.update({ where: { id: req.user.id }, data: { avatarUrl } });

    const oldFilename = getFilenameFromUrl(user.avatarUrl);
    if (oldFilename) deleteAvatarFile(oldFilename);

    return res.json({
      success: true,
      data: { avatarUrl, size: req.file.size },
      message: 'Avatar uploadé avec succès'
    });
  } catch (error) {
    if (newFilename) deleteAvatarFile(newFilename);
    console.error('Erreur uploadAvatar:', error.message);
    return res.status(500).json({ success: false, error: 'Erreur lors de l\'upload de l\'avatar' });
  }
}

async function deleteAvatar(req, res) {
  try {
    const user = await prisma.dueliste.findUnique({
      where: { id: req.user.id },
      select: { avatarUrl: true }
    });
    if (!user) return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });

    await prisma.dueliste.update({ where: { id: req.user.id }, data: { avatarUrl: null } });
    const filename = getFilenameFromUrl(user.avatarUrl);
    if (filename) deleteAvatarFile(filename);
    return res.json({ success: true, message: 'Avatar supprimé avec succès' });
  } catch (error) {
    console.error('Erreur deleteAvatar:', error.message);
    return res.status(500).json({ success: false, error: 'Erreur lors de la suppression de l\'avatar' });
  }
}

module.exports = { uploadAvatar, deleteAvatar };
