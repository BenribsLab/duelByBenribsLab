const request = require('supertest');

jest.mock('../../services/emailService', () => ({
  sendOTPEmail: jest.fn().mockResolvedValue(true),
  sendParentalConsentRequestEmail: jest.fn().mockResolvedValue(true),
  sendParentalConsentAdminReviewEmail: jest.fn().mockResolvedValue(true)
}));

const emailService = require('../../services/emailService');
const app = require('../../app');
const { createParentalConsentToken } = require('../../utils/parentalConsentToken');
const { resetDatabase, prisma, TEST_PASSWORD } = require('../helpers/testUtils');

describe('consentement parental (comptes Junior)', () => {
  beforeEach(async () => {
    await resetDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function inscrireJunior(overrides = {}) {
    return request(app)
      .post('/api/auth/register')
      .send({
        pseudo: 'juniorTest',
        password: TEST_PASSWORD,
        authMode: 'PASSWORD',
        categorie: 'JUNIOR',
        parentEmail: 'parent@example.test',
        ...overrides
      });
  }

  function dernierLienParent() {
    const url = emailService.sendParentalConsentRequestEmail.mock.calls.at(-1)[2];
    return new URL(url).searchParams.get('token');
  }

  function dernierLienAdmin() {
    const url = emailService.sendParentalConsentAdminReviewEmail.mock.calls.at(-1)[3];
    return new URL(url).searchParams.get('token');
  }

  describe('inscription', () => {
    test('un compte Junior sans e-mail parent est refusé', async () => {
      const response = await inscrireJunior({ parentEmail: undefined });
      expect(response.status).toBe(400);
      expect(await prisma.dueliste.count()).toBe(0);
    });

    test('un compte Junior est créé bloqué, et un e-mail part au parent', async () => {
      const response = await inscrireJunior();

      expect(response.status).toBe(201);
      expect(response.body.data.requiresParentalConsent).toBe(true);
      expect(response.body.data.token).toBeUndefined();

      const user = await prisma.dueliste.findUnique({ where: { pseudo: 'juniorTest' } });
      expect(user.statut).toBe('EN_ATTENTE_PARENTAL');
      expect(emailService.sendParentalConsentRequestEmail).toHaveBeenCalledTimes(1);

      const consent = await prisma.parentalConsent.findUnique({ where: { duelisteId: user.id } });
      expect(consent.status).toBe('PENDING_PARENT');
      expect(consent.parentEmail).toBe('parent@example.test');
    });

    test('un compte Senior ignore tout le mécanisme', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ pseudo: 'seniorTest', password: TEST_PASSWORD, authMode: 'PASSWORD', categorie: 'SENIOR' });

      expect(response.status).toBe(201);
      expect(response.body.data.requiresParentalConsent).toBeUndefined();
      const user = await prisma.dueliste.findUnique({ where: { pseudo: 'seniorTest' } });
      expect(user.statut).toBe('ACTIF');
      expect(emailService.sendParentalConsentRequestEmail).not.toHaveBeenCalled();
    });

    test('un compte bloqué ne peut pas se connecter', async () => {
      await inscrireJunior();
      const login = await request(app)
        .post('/api/auth/login')
        .send({ pseudo: 'juniorTest', password: TEST_PASSWORD });

      expect(login.status).toBe(401);
    });

    test('si l\'envoi au parent échoue, le compte est supprimé plutôt que laissé bloqué indéfiniment', async () => {
      emailService.sendParentalConsentRequestEmail.mockRejectedValueOnce(new Error('SMTP indisponible'));
      const response = await inscrireJunior();

      expect(response.status).toBe(503);
      expect(await prisma.dueliste.count()).toBe(0);
    });
  });

  describe('décision du parent', () => {
    test('le parent voit le pseudo de l\'enfant avant de décider', async () => {
      await inscrireJunior();
      const token = dernierLienParent();

      const response = await request(app).get(`/api/parental-consent/parent/${token}`);
      expect(response.status).toBe(200);
      expect(response.body.data.pseudo).toBe('juniorTest');
    });

    test('accepter fait passer la demande en attente admin et notifie l\'admin', async () => {
      await inscrireJunior();
      const token = dernierLienParent();

      const response = await request(app)
        .post(`/api/parental-consent/parent/${token}`)
        .send({ decision: 'accept' });

      expect(response.status).toBe(200);
      const user = await prisma.dueliste.findUnique({ where: { pseudo: 'juniorTest' } });
      expect(user.statut).toBe('EN_ATTENTE_PARENTAL'); // pas encore actif : admin doit encore valider

      const consent = await prisma.parentalConsent.findFirst({ where: { duelisteId: user.id } });
      expect(consent.status).toBe('PENDING_ADMIN');
      expect(emailService.sendParentalConsentAdminReviewEmail).toHaveBeenCalledTimes(1);
    });

    test('refuser supprime le compte de l\'enfant', async () => {
      await inscrireJunior();
      const token = dernierLienParent();

      const response = await request(app)
        .post(`/api/parental-consent/parent/${token}`)
        .send({ decision: 'reject' });

      expect(response.status).toBe(200);
      expect(await prisma.dueliste.findUnique({ where: { pseudo: 'juniorTest' } })).toBeNull();
    });

    test('un lien parent déjà utilisé ne peut pas être rejoué', async () => {
      await inscrireJunior();
      const token = dernierLienParent();

      await request(app).post(`/api/parental-consent/parent/${token}`).send({ decision: 'accept' });
      const rejeu = await request(app).post(`/api/parental-consent/parent/${token}`).send({ decision: 'reject' });

      expect(rejeu.status).toBe(409);
    });

    test('un lien parent altéré est refusé', async () => {
      await inscrireJunior();
      const token = dernierLienParent();
      const altere = `${token.slice(0, -1)}${token.at(-1) === 'a' ? 'b' : 'a'}`;

      const response = await request(app)
        .post(`/api/parental-consent/parent/${altere}`)
        .send({ decision: 'accept' });

      expect(response.status).toBe(400);
    });
  });

  describe('décision de l\'administrateur', () => {
    async function jusquaPendingAdmin() {
      await inscrireJunior();
      const parentToken = dernierLienParent();
      await request(app).post(`/api/parental-consent/parent/${parentToken}`).send({ decision: 'accept' });
      return dernierLienAdmin();
    }

    test('approuver active le compte', async () => {
      const adminToken = await jusquaPendingAdmin();

      const response = await request(app)
        .post(`/api/parental-consent/admin/${adminToken}`)
        .send({ decision: 'accept' });

      expect(response.status).toBe(200);
      const user = await prisma.dueliste.findUnique({ where: { pseudo: 'juniorTest' } });
      expect(user.statut).toBe('ACTIF');

      // Le compte est desormais utilisable normalement.
      const login = await request(app)
        .post('/api/auth/login')
        .send({ pseudo: 'juniorTest', password: TEST_PASSWORD });
      expect(login.status).toBe(200);
    });

    test('rejeter supprime le compte', async () => {
      const adminToken = await jusquaPendingAdmin();

      const response = await request(app)
        .post(`/api/parental-consent/admin/${adminToken}`)
        .send({ decision: 'reject' });

      expect(response.status).toBe(200);
      expect(await prisma.dueliste.findUnique({ where: { pseudo: 'juniorTest' } })).toBeNull();
    });

    test('le lien du parent ne fonctionne pas comme lien admin', async () => {
      await inscrireJunior();
      const parentToken = dernierLienParent();

      const response = await request(app)
        .post(`/api/parental-consent/admin/${parentToken}`)
        .send({ decision: 'accept' });

      expect(response.status).toBe(400);
    });

    test('l\'admin ne peut pas décider avant que le parent n\'ait accepté', async () => {
      await inscrireJunior();
      const parentToken = dernierLienParent();
      // On forge un jeton "admin" pour le meme consentId, sans que le parent
      // n'ait jamais accepte : le statut PENDING_ADMIN attendu par le service
      // ne sera pas atteint, l'action doit donc etre refusee.
      const consent = await prisma.parentalConsent.findFirst();
      const adminToken = createParentalConsentToken(consent.id, 'admin', consent.expiresAt);
      void parentToken;

      const response = await request(app)
        .post(`/api/parental-consent/admin/${adminToken}`)
        .send({ decision: 'accept' });

      expect(response.status).toBe(409);
    });
  });
});
