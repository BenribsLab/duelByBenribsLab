const jwt = require('jsonwebtoken');
const request = require('supertest');

jest.mock('../../services/emailService', () => ({
  sendOTPEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendInvitationEmail: jest.fn().mockResolvedValue(true)
}));

const emailService = require('../../services/emailService');
const app = require('../../app');
const authService = require('../../services/authService');
const { resetDatabase, createUser, bearer, prisma, TEST_PASSWORD } = require('../helpers/testUtils');

const dernierOTP = () => emailService.sendOTPEmail.mock.calls.at(-1)[1];

describe('authentification, OTP et révocation de session', () => {
  beforeEach(async () => {
    await resetDatabase();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('inscription', () => {
    test('le parcours mot de passe refuse d\'associer un email non vérifié', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ pseudo: 'carla', password: TEST_PASSWORD, email: 'carla@example.test', authMode: 'PASSWORD' });

      expect(response.status).toBe(400);
      expect(await prisma.dueliste.findFirst({ where: { email: 'carla@example.test' } })).toBeNull();
    });

    test('un mot de passe de moins de 10 caractères est refusé', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ pseudo: 'carla', password: 'court123', authMode: 'PASSWORD' });

      expect(response.status).toBe(400);
    });

    test('une inscription valide ne renvoie jamais le hash du mot de passe', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ pseudo: 'carla', password: TEST_PASSWORD, authMode: 'PASSWORD' });

      expect(response.status).toBe(201);
      expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|otpCode|tokenVersion/);
    });
  });

  describe('connexion par mot de passe', () => {
    test('un pseudo inconnu et un mauvais mot de passe donnent la même réponse', async () => {
      await createUser({ pseudo: 'dora' });

      const inconnu = await request(app).post('/api/auth/login').send({ pseudo: 'inexistant', password: TEST_PASSWORD });
      const mauvaisMdp = await request(app).post('/api/auth/login').send({ pseudo: 'dora', password: 'MauvaisMotDePasse!' });

      expect(inconnu.status).toBe(mauvaisMdp.status);
      expect(inconnu.body.error).toBe(mauvaisMdp.body.error);
      expect(inconnu.status).toBe(401);
    });

    test('un compte inactif ne peut pas se connecter', async () => {
      await createUser({ pseudo: 'elias', statut: 'SUSPENDU' });

      const response = await request(app).post('/api/auth/login').send({ pseudo: 'elias', password: TEST_PASSWORD });
      expect(response.status).toBe(401);
    });

    test('une connexion valide donne un jeton exploitable sur /me', async () => {
      await createUser({ pseudo: 'fanny' });

      const connexion = await request(app).post('/api/auth/login').send({ pseudo: 'fanny', password: TEST_PASSWORD });
      expect(connexion.status).toBe(200);

      const profil = await request(app).get('/api/auth/me').set(bearer(connexion.body.data.token));
      expect(profil.status).toBe(200);
      expect(profil.body.data.user.pseudo).toBe('fanny');
    });
  });

  describe('validation des jetons JWT', () => {
    test('un jeton signé avec un autre secret est refusé', async () => {
      const user = await createUser();
      const faux = jwt.sign({ userId: user.id, tokenVersion: 0 }, 'un-autre-secret-suffisamment-long', {
        algorithm: 'HS256',
        issuer: 'duel-api',
        audience: 'duel-app',
        expiresIn: '1h'
      });

      expect((await request(app).get('/api/auth/me').set(bearer(faux))).status).toBe(401);
    });

    test('un jeton sans signature (alg none) est refusé', async () => {
      const user = await createUser();
      const entete = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const charge = Buffer.from(JSON.stringify({
        userId: user.id,
        tokenVersion: 0,
        iss: 'duel-api',
        aud: 'duel-app',
        exp: Math.floor(Date.now() / 1000) + 3600
      })).toString('base64url');

      expect((await request(app).get('/api/auth/me').set(bearer(`${entete}.${charge}.`))).status).toBe(401);
    });

    test('un jeton au mauvais émetteur ou à la mauvaise audience est refusé', async () => {
      const user = await createUser();
      const options = { algorithm: 'HS256', expiresIn: '1h' };

      const mauvaisIssuer = jwt.sign({ userId: user.id, tokenVersion: 0 }, process.env.JWT_SECRET,
        { ...options, issuer: 'autre-api', audience: 'duel-app' });
      const mauvaiseAudience = jwt.sign({ userId: user.id, tokenVersion: 0 }, process.env.JWT_SECRET,
        { ...options, issuer: 'duel-api', audience: 'duel-admin' });

      expect((await request(app).get('/api/auth/me').set(bearer(mauvaisIssuer))).status).toBe(401);
      expect((await request(app).get('/api/auth/me').set(bearer(mauvaiseAudience))).status).toBe(401);
    });

    test('un jeton utilisateur ne passe pas sur les routes admin', async () => {
      const user = await createUser();
      expect((await request(app).post('/api/admin/auth/verify').set(bearer(user.token))).status).toBe(401);
    });

    test('un jeton expiré est refusé', async () => {
      const user = await createUser();
      const expire = jwt.sign({ userId: user.id, tokenVersion: 0 }, process.env.JWT_SECRET, {
        algorithm: 'HS256',
        issuer: 'duel-api',
        audience: 'duel-app',
        expiresIn: -10
      });

      expect((await request(app).get('/api/auth/me').set(bearer(expire))).status).toBe(401);
    });
  });

  describe('révocation de session', () => {
    test('la déconnexion invalide immédiatement le jeton précédent', async () => {
      const user = await createUser();

      expect((await request(app).get('/api/auth/me').set(bearer(user.token))).status).toBe(200);

      const deconnexion = await request(app).post('/api/auth/logout').set(bearer(user.token));
      expect(deconnexion.status).toBe(200);

      expect((await request(app).get('/api/auth/me').set(bearer(user.token))).status).toBe(401);
      expect((await request(app).get('/api/duels').set(bearer(user.token))).status).toBe(401);
    });

    test('la désactivation d\'un compte invalide ses jetons en cours', async () => {
      const user = await createUser();
      await prisma.dueliste.update({ where: { id: user.id }, data: { statut: 'SUSPENDU' } });

      expect((await request(app).get('/api/auth/me').set(bearer(user.token))).status).toBe(401);
    });
  });

  describe('OTP', () => {
    async function inscrireEnOTP(pseudo, email) {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ pseudo, email, authMode: 'OTP', hasEmailAccess: true });
      return response;
    }

    test('le code OTP n\'est jamais renvoyé dans la réponse et n\'est pas stocké en clair', async () => {
      const response = await inscrireEnOTP('gaby', 'gaby@example.test');
      expect(response.status).toBe(201);

      const code = dernierOTP();
      expect(code).toMatch(/^\d{6}$/);
      expect(JSON.stringify(response.body)).not.toContain(code);

      const enBase = await prisma.dueliste.findUnique({ where: { email: 'gaby@example.test' } });
      expect(enBase.otpCode).not.toBe(code);
      expect(enBase.otpCode).toBe(authService.hashOTP(code));
    });

    test('un code valide authentifie et marque l\'email comme vérifié', async () => {
      await inscrireEnOTP('hugo', 'hugo@example.test');
      const code = dernierOTP();

      const verification = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'hugo@example.test', otpCode: code });

      expect(verification.status).toBe(200);
      expect(verification.body.data.user.emailVerified).toBe(true);

      const enBase = await prisma.dueliste.findUnique({ where: { email: 'hugo@example.test' } });
      expect(enBase.otpCode).toBeNull();
    });

    test('un code déjà consommé ne peut pas être rejoué', async () => {
      await inscrireEnOTP('inès', 'ines@example.test');
      const code = dernierOTP();

      await request(app).post('/api/auth/verify-otp').send({ email: 'ines@example.test', otpCode: code });
      const rejeu = await request(app).post('/api/auth/verify-otp').send({ email: 'ines@example.test', otpCode: code });

      expect(rejeu.status).toBe(401);
    });

    test('un code expiré est refusé', async () => {
      await inscrireEnOTP('jules', 'jules@example.test');
      const code = dernierOTP();
      await prisma.dueliste.update({
        where: { email: 'jules@example.test' },
        data: { otpExpiry: new Date(Date.now() - 1000) }
      });

      const response = await request(app).post('/api/auth/verify-otp').send({ email: 'jules@example.test', otpCode: code });
      expect(response.status).toBe(401);
    });

    test('cinq échecs verrouillent le compte et invalident le code en cours', async () => {
      await inscrireEnOTP('karim', 'karim@example.test');
      const code = dernierOTP();
      const faux = code === '000000' ? '111111' : '000000';

      for (let tentative = 0; tentative < 5; tentative += 1) {
        const echec = await request(app).post('/api/auth/verify-otp').send({ email: 'karim@example.test', otpCode: faux });
        expect(echec.status).toBe(401);
      }

      const verrouille = await request(app).post('/api/auth/verify-otp').send({ email: 'karim@example.test', otpCode: code });
      expect(verrouille.status).toBe(429);

      const enBase = await prisma.dueliste.findUnique({ where: { email: 'karim@example.test' } });
      expect(enBase.otpCode).toBeNull();
      expect(enBase.otpLockedUntil.getTime()).toBeGreaterThan(Date.now());
    });

    test('une adresse inconnue ne révèle pas son inexistence', async () => {
      await inscrireEnOTP('lea', 'lea@example.test');
      jest.clearAllMocks();
      // Neutraliser le délai anti-renvoi hérité de l'inscription.
      await prisma.dueliste.update({ where: { email: 'lea@example.test' }, data: { otpLastSentAt: null } });

      const connue = await request(app).post('/api/auth/login').send({ email: 'lea@example.test' });
      const inconnue = await request(app).post('/api/auth/login').send({ email: 'personne@example.test' });

      expect(connue.status).toBe(inconnue.status);
      expect(connue.body).toEqual(inconnue.body);
      // Le mail n'est envoyé que pour le compte qui existe réellement.
      expect(emailService.sendOTPEmail).toHaveBeenCalledTimes(1);
    });

    test('le délai anti-renvoi bloque les demandes de code répétées', async () => {
      await inscrireEnOTP('nora', 'nora@example.test');
      jest.clearAllMocks();

      const response = await request(app).post('/api/auth/login').send({ email: 'nora@example.test' });

      expect(response.status).toBe(200);
      expect(emailService.sendOTPEmail).not.toHaveBeenCalled();
    });

    test('un email déjà utilisé ne peut pas être réenregistré', async () => {
      await inscrireEnOTP('marc', 'marc@example.test');
      const doublon = await inscrireEnOTP('marco', 'marc@example.test');
      expect(doublon.status).toBe(409);
    });

    test('l\'ancienne route de vérification d\'existence d\'email n\'existe plus', async () => {
      const response = await request(app).post('/api/auth/check-email').send({ email: 'marc@example.test' });
      expect(response.status).toBe(404);
    });
  });

  describe('administration', () => {
    test('les identifiants de démonstration sont refusés', async () => {
      const response = await request(app).post('/api/admin/auth/login').send({ username: 'admin', password: 'test123' });
      expect(response.status).toBe(401);
    });

    test('les identifiants configurés donnent un jeton admin', async () => {
      const response = await request(app)
        .post('/api/admin/auth/login')
        .send({ username: process.env.ADMIN_USERNAME, password: process.env.TEST_ADMIN_PASSWORD });

      expect(response.status).toBe(200);
      const token = response.body.data?.token || response.body.token;
      expect(typeof token).toBe('string');

      const verification = await request(app).post('/api/admin/auth/verify').set(bearer(token));
      expect(verification.status).toBe(200);
    });
  });
});
