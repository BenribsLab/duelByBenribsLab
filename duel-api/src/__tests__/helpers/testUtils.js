const bcrypt = require('bcryptjs');
const { prisma } = require('../../database');
const authService = require('../../services/authService');
const adminAuthService = require('../../services/adminAuthService');

let counter = 0;

async function resetDatabase() {
  await prisma.validationScore.deleteMany();
  await prisma.emailInvitation.deleteMany();
  await prisma.duel.deleteMany();
  await prisma.dueliste.deleteMany();
}

const TEST_PASSWORD = 'MotDePasse2026!';

async function createUser(overrides = {}) {
  counter += 1;
  const { password, ...fields } = overrides;
  const user = await prisma.dueliste.create({
    data: {
      pseudo: `joueur${counter}-${Date.now().toString(36)}`,
      passwordHash: await bcrypt.hash(password || TEST_PASSWORD, 4),
      authMode: 'PASSWORD',
      statut: 'ACTIF',
      ...fields
    }
  });
  return { ...user, token: authService.generateToken(user) };
}

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

function adminToken() {
  return adminAuthService.generateAdminToken(process.env.ADMIN_USERNAME || 'admin');
}

module.exports = { resetDatabase, createUser, bearer, adminToken, prisma, TEST_PASSWORD };
