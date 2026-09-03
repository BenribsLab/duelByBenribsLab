const request = require('supertest');

jest.mock('../../services/emailService', () => ({
  sendOTPEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendInvitationEmail: jest.fn().mockResolvedValue(true)
}));

const emailService = require('../../services/emailService');
const app = require('../../app');
const { createTrackingToken } = require('../../utils/trackingToken');
const { resetDatabase, createUser, bearer, prisma } = require('../helpers/testUtils');

describe('invitations et liens de suivi', () => {
  let alice;

  beforeEach(async () => {
    await resetDatabase();
    jest.clearAllMocks();
    alice = await createUser({ pseudo: 'alice', email: 'alice@example.test', emailVerified: true });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('envoi', () => {
    test('un envoi réussi enregistre l\'invitation au statut SENT', async () => {
      const response = await request(app)
        .post('/api/invitations/email')
        .set(bearer(alice.token))
        .send({ email: 'invite@example.test' });

      expect(response.status).toBe(200);
      const invitation = await prisma.emailInvitation.findFirst({ where: { email: 'invite@example.test' } });
      expect(invitation.status).toBe('SENT');
    });

    test('un échec d\'envoi ne laisse pas d\'invitation en attente et n\'empêche pas de réessayer', async () => {
      emailService.sendInvitationEmail.mockRejectedValueOnce(new Error('SMTP indisponible'));

      const echec = await request(app)
        .post('/api/invitations/email')
        .set(bearer(alice.token))
        .send({ email: 'invite@example.test' });

      expect(echec.status).toBe(503);
      const apresEchec = await prisma.emailInvitation.findFirst({ where: { email: 'invite@example.test' } });
      expect(apresEchec.status).toBe('FAILED');

      // La règle anti-doublon de 24 h ne doit pas bloquer une nouvelle tentative.
      const reprise = await request(app)
        .post('/api/invitations/email')
        .set(bearer(alice.token))
        .send({ email: 'invite@example.test' });

      expect(reprise.status).toBe(200);
      expect(await prisma.emailInvitation.count({ where: { email: 'invite@example.test', status: 'SENT' } })).toBe(1);
    });

    test('une invitation déjà envoyée dans les 24 h est refusée', async () => {
      await request(app).post('/api/invitations/email').set(bearer(alice.token)).send({ email: 'invite@example.test' });
      const doublon = await request(app).post('/api/invitations/email').set(bearer(alice.token)).send({ email: 'invite@example.test' });

      expect(doublon.status).toBe(429);
    });

    test('inviter une adresse déjà inscrite ne révèle pas le compte existant', async () => {
      const response = await request(app)
        .post('/api/invitations/email')
        .set(bearer(alice.token))
        .send({ email: 'alice@example.test' });

      expect(response.status).toBe(409);
      expect(JSON.stringify(response.body)).not.toMatch(/alice|déjà inscrit/i);
    });

    test('l\'envoi d\'invitation exige une authentification', async () => {
      const response = await request(app).post('/api/invitations/email').send({ email: 'invite@example.test' });
      expect(response.status).toBe(401);
    });
  });

  describe('liens de suivi', () => {
    async function creerInvitation(email = 'invite@example.test', expiresAt = new Date(Date.now() + 86400000)) {
      return prisma.emailInvitation.create({
        data: { email, inviterId: alice.id, status: 'SENT', expiresAt }
      });
    }

    test('un identifiant brut ne suffit plus à ouvrir un lien de suivi', async () => {
      const invitation = await creerInvitation();

      const response = await request(app).get(`/api/track/invitation-click/${invitation.id}`);
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe(process.env.FRONTEND_URL);

      const inchangee = await prisma.emailInvitation.findUnique({ where: { id: invitation.id } });
      expect(inchangee.status).toBe('SENT');
    });

    test('un jeton signé valide enregistre le clic et redirige vers le frontend fixe', async () => {
      const invitation = await creerInvitation();
      const token = createTrackingToken(invitation.id, invitation.expiresAt);

      const response = await request(app).get(`/api/track/invitation-click/${token}`);
      expect(response.status).toBe(302);
      expect(response.headers.location.startsWith(`${process.env.FRONTEND_URL}/register?`)).toBe(true);

      const misAJour = await prisma.emailInvitation.findUnique({ where: { id: invitation.id } });
      expect(misAJour.status).toBe('CLICKED');
    });

    test('aucun paramètre ne permet de rediriger vers un site tiers', async () => {
      const invitation = await creerInvitation();
      const token = createTrackingToken(invitation.id, invitation.expiresAt);

      const response = await request(app)
        .get(`/api/track/invitation-click/${token}`)
        .query({ redirect: 'https://site-malveillant.test', url: 'https://site-malveillant.test' });

      expect(response.headers.location).not.toMatch(/site-malveillant/);
      expect(response.headers.location.startsWith(process.env.FRONTEND_URL)).toBe(true);
    });

    test('un jeton altéré est ignoré', async () => {
      const invitation = await creerInvitation();
      const token = createTrackingToken(invitation.id, invitation.expiresAt);
      const altere = `${token.slice(0, -1)}${token.at(-1) === 'a' ? 'b' : 'a'}`;

      await request(app).get(`/api/track/email-open/${altere}`);
      const inchangee = await prisma.emailInvitation.findUnique({ where: { id: invitation.id } });
      expect(inchangee.openedAt).toBeNull();
    });

    test('un jeton expiré est ignoré', async () => {
      const invitation = await creerInvitation('invite@example.test', new Date(Date.now() - 1000));
      const token = createTrackingToken(invitation.id, invitation.expiresAt);

      const response = await request(app).get(`/api/track/invitation-click/${token}`);
      expect(response.headers.location).toBe(process.env.FRONTEND_URL);
    });

    test('la conversion n\'est enregistrée que pour l\'adresse réellement invitée', async () => {
      const invitation = await creerInvitation('quelquun-dautre@example.test');
      const token = createTrackingToken(invitation.id, invitation.expiresAt);

      const usurpation = await request(app)
        .post('/api/track/invitation-registered')
        .set(bearer(alice.token))
        .send({ invitationToken: token });

      expect(usurpation.status).toBe(403);
      expect((await prisma.emailInvitation.findUnique({ where: { id: invitation.id } })).registeredUserId).toBeNull();
    });

    test('la conversion est acceptée pour le bon compte et lie l\'utilisateur authentifié', async () => {
      const invitation = await creerInvitation('alice@example.test');
      const token = createTrackingToken(invitation.id, invitation.expiresAt);

      const response = await request(app)
        .post('/api/track/invitation-registered')
        .set(bearer(alice.token))
        .send({ invitationToken: token });

      expect(response.status).toBe(200);
      const misAJour = await prisma.emailInvitation.findUnique({ where: { id: invitation.id } });
      expect(misAJour.registeredUserId).toBe(alice.id);
      expect(misAJour.status).toBe('REGISTERED');
    });
  });
});
