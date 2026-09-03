const request = require('supertest');
const app = require('../../app');
const { resetDatabase, createUser, bearer, adminToken, prisma } = require('../helpers/testUtils');

describe('contrôles d\'accès (BOLA / IDOR)', () => {
  let alice;
  let bob;
  let mallory;

  beforeEach(async () => {
    await resetDatabase();
    alice = await createUser({ pseudo: 'alice', email: 'alice@example.test', emailVerified: true });
    bob = await createUser({ pseudo: 'bob' });
    mallory = await createUser({ pseudo: 'mallory' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function duelEntreAliceEtBob(etat = 'PROPOSE', extra = {}) {
    return prisma.duel.create({
      data: { provocateurId: alice.id, adversaireId: bob.id, etat, ...extra }
    });
  }

  describe('profils', () => {
    test('un utilisateur ne peut pas modifier le profil d\'un autre', async () => {
      const response = await request(app)
        .put(`/api/duellistes/${alice.id}`)
        .set(bearer(mallory.token))
        .send({ pseudo: 'alice-piratee' });

      expect(response.status).toBe(403);
      const inchangee = await prisma.dueliste.findUnique({ where: { id: alice.id } });
      expect(inchangee.pseudo).toBe('alice');
    });

    test('un utilisateur ne peut pas supprimer le compte d\'un autre', async () => {
      const response = await request(app)
        .delete(`/api/duellistes/${alice.id}`)
        .set(bearer(mallory.token));

      expect(response.status).toBe(403);
      expect(await prisma.dueliste.findUnique({ where: { id: alice.id } })).not.toBeNull();
    });

    test('un utilisateur ne peut pas marquer les notifications d\'un autre comme lues', async () => {
      const response = await request(app)
        .put(`/api/duellistes/${alice.id}/notifications/mark-read`)
        .set(bearer(mallory.token));

      expect(response.status).toBe(403);
    });

    test('le profil d\'un tiers n\'expose ni email ni données internes', async () => {
      const response = await request(app)
        .get(`/api/duellistes/${alice.id}`)
        .set(bearer(mallory.token));

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBeUndefined();
      expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|otpCode|pushToken|tokenVersion/);
    });

    test('son propre profil expose l\'email mais jamais les secrets', async () => {
      const response = await request(app)
        .get(`/api/duellistes/${alice.id}`)
        .set(bearer(alice.token));

      expect(response.status).toBe(200);
      expect(response.body.data.email).toBe('alice@example.test');
      expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|otpCode|pushToken|tokenVersion/);
    });

    test('l\'avatar ne peut pas être une URL externe ni une data URL', async () => {
      const refuses = [
        'https://tiers.example/pixel.png',
        'data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+',
        'javascript:alert(1)',
        '/uploads/avatars/../../etc/passwd'
      ];

      for (const avatarUrl of refuses) {
        const response = await request(app)
          .put(`/api/duellistes/${alice.id}`)
          .set(bearer(alice.token))
          .send({ avatarUrl });
        expect(response.status).toBe(400);
      }

      expect((await prisma.dueliste.findUnique({ where: { id: alice.id } })).avatarUrl).toBeNull();

      const accepte = await request(app)
        .put(`/api/duellistes/${alice.id}`)
        .set(bearer(alice.token))
        .send({ avatarUrl: '/uploads/avatars/avatar_abc123.png' });
      expect(accepte.status).toBe(200);
    });

    test('la route de création directe de dueliste n\'existe plus', async () => {
      const response = await request(app)
        .post('/api/duellistes')
        .set(bearer(mallory.token))
        .send({ pseudo: 'compte-fantome' });

      expect(response.status).toBe(404);
      expect(await prisma.dueliste.findUnique({ where: { pseudo: 'compte-fantome' } })).toBeNull();
    });

    test('sans jeton, les routes de duellistes répondent 401', async () => {
      const liste = await request(app).get('/api/duellistes');
      expect(liste.status).toBe(401);

      const modification = await request(app).put(`/api/duellistes/${alice.id}`).send({ pseudo: 'x' });
      expect(modification.status).toBe(401);
    });
  });

  describe('duels', () => {
    test('un tiers ne peut pas consulter un duel auquel il ne participe pas', async () => {
      const duel = await duelEntreAliceEtBob();

      const refuse = await request(app).get(`/api/duels/${duel.id}`).set(bearer(mallory.token));
      expect(refuse.status).toBe(403);

      const autorise = await request(app).get(`/api/duels/${duel.id}`).set(bearer(bob.token));
      expect(autorise.status).toBe(200);
    });

    test('l\'arbitre désigné peut consulter le duel', async () => {
      const duel = await duelEntreAliceEtBob('A_JOUER', { arbitreId: mallory.id });
      const response = await request(app).get(`/api/duels/${duel.id}`).set(bearer(mallory.token));
      expect(response.status).toBe(200);
    });

    test('la liste des duels ne renvoie que ceux de l\'appelant', async () => {
      await duelEntreAliceEtBob();
      const response = await request(app).get('/api/duels').set(bearer(mallory.token));

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });

    test('le provocateur vient du jeton, pas du corps de la requête', async () => {
      const response = await request(app)
        .post('/api/duels')
        .set(bearer(mallory.token))
        .send({ provocateurId: alice.id, adversaireId: bob.id });

      expect(response.status).toBe(201);
      expect(response.body.data.provocateurId).toBe(mallory.id);
    });

    test('seul l\'adversaire peut accepter, même en usurpant l\'identifiant', async () => {
      const duel = await duelEntreAliceEtBob();

      const usurpation = await request(app)
        .put(`/api/duels/${duel.id}/accepter`)
        .set(bearer(mallory.token))
        .send({ adversaireId: bob.id });

      expect(usurpation.status).toBe(403);
      expect((await prisma.duel.findUnique({ where: { id: duel.id } })).etat).toBe('PROPOSE');
    });

    test('le provocateur ne peut pas accepter son propre duel', async () => {
      const duel = await duelEntreAliceEtBob();
      const response = await request(app)
        .put(`/api/duels/${duel.id}/accepter`)
        .set(bearer(alice.token))
        .send({});

      expect(response.status).toBe(403);
    });

    test('seul l\'adversaire peut refuser le duel', async () => {
      const duel = await duelEntreAliceEtBob();
      const response = await request(app)
        .put(`/api/duels/${duel.id}/refuser`)
        .set(bearer(mallory.token))
        .send({ adversaireId: bob.id });

      expect(response.status).toBe(403);
      expect((await prisma.duel.findUnique({ where: { id: duel.id } })).etat).toBe('PROPOSE');
    });

    test('un tiers ne peut pas saisir le score d\'un duel', async () => {
      const duel = await duelEntreAliceEtBob('A_JOUER');
      const response = await request(app)
        .put(`/api/duels/${duel.id}/score`)
        .set(bearer(mallory.token))
        .send({ scoreProvocateur: 5, scoreAdversaire: 3 });

      expect(response.status).toBe(403);
      expect((await prisma.duel.findUnique({ where: { id: duel.id } })).scoreProvocateur).toBeNull();
    });

    test('un tiers ne peut pas lire la proposition de score', async () => {
      const duel = await duelEntreAliceEtBob('A_JOUER');
      await request(app)
        .put(`/api/duels/${duel.id}/score`)
        .set(bearer(alice.token))
        .send({ scoreProvocateur: 5, scoreAdversaire: 3 });

      const response = await request(app)
        .get(`/api/duels/${duel.id}/proposition`)
        .set(bearer(mallory.token));

      expect(response.status).toBe(403);
    });

    test('un tiers ne peut pas accepter une proposition de score', async () => {
      const duel = await duelEntreAliceEtBob('A_JOUER');
      await request(app)
        .put(`/api/duels/${duel.id}/score`)
        .set(bearer(alice.token))
        .send({ scoreProvocateur: 5, scoreAdversaire: 3 });

      const response = await request(app)
        .put(`/api/duels/${duel.id}/accepter-proposition`)
        .set(bearer(mallory.token))
        .send({});

      expect(response.status).toBe(403);
      expect((await prisma.duel.findUnique({ where: { id: duel.id } })).etat).not.toBe('VALIDE');
    });
  });

  describe('jetons push', () => {
    test('un utilisateur ne peut pas enregistrer un jeton push sur le compte d\'un autre', async () => {
      const response = await request(app)
        .post(`/api/users/${alice.id}/push-token`)
        .set(bearer(mallory.token))
        .send({ pushToken: 'jeton-fcm-de-test-12345', platform: 'android' });

      expect(response.status).toBe(403);
      expect((await prisma.dueliste.findUnique({ where: { id: alice.id } })).pushToken).toBeNull();
    });

    test('un utilisateur ne peut pas supprimer le jeton push d\'un autre', async () => {
      await prisma.dueliste.update({ where: { id: alice.id }, data: { pushToken: 'jeton-a-conserver' } });

      const response = await request(app)
        .delete(`/api/users/${alice.id}/push-token`)
        .set(bearer(mallory.token));

      expect(response.status).toBe(403);
      expect((await prisma.dueliste.findUnique({ where: { id: alice.id } })).pushToken).toBe('jeton-a-conserver');
    });
  });

  describe('classement et administration', () => {
    test('le classement public n\'expose aucune donnée sensible', async () => {
      const response = await request(app).get('/api/classement');
      expect(response.status).toBe(200);
      expect(JSON.stringify(response.body)).not.toMatch(/passwordHash|otpCode|pushToken|tokenVersion|@example\.test/);
    });

    test('le classement anonyme se limite au rang, pseudo, avatar, V/D et points', async () => {
      const response = await request(app).get('/api/classement');

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      for (const entree of response.body.data) {
        expect(Object.keys(entree).sort()).toEqual(
          ['avatarUrl', 'categorie', 'nbDefaites', 'nbVictoires', 'pseudo', 'rang', 'totalPoints'].sort()
        );
      }
    });

    test('sans identifiant public, un tiers ne peut plus énumérer les membres un à un', async () => {
      const anonyme = await request(app).get('/api/classement');
      expect(JSON.stringify(anonyme.body)).not.toMatch(/"id"|dateInscription|createdAt|indiceTouches/);

      // Et la route de détail par identifiant exige désormais un compte.
      expect((await request(app).get(`/api/classement/dueliste/${alice.id}`)).status).toBe(401);
      expect(
        (await request(app).get(`/api/classement/dueliste/${alice.id}`).set(bearer(mallory.token))).status
      ).toBe(200);
    });

    test('le classement anonyme est borné même si le client demande tout', async () => {
      const response = await request(app).get('/api/classement').query({ limit: 100000 });
      expect(response.status).toBe(400); // le validateur plafonne déjà à 100

      const sansLimite = await request(app).get('/api/classement');
      expect(sansLimite.body.data.length).toBeLessThanOrEqual(20);
    });

    test('un appelant authentifié conserve le classement détaillé', async () => {
      const response = await request(app).get('/api/classement').set(bearer(alice.token));

      expect(response.status).toBe(200);
      const premiere = response.body.data[0];
      expect(premiere.id).toBeDefined();
      expect(premiere.indiceTouches).toBeDefined();
      expect(premiere.nbMatchsTotal).toBeDefined();
    });

    test('les statistiques globales ne sont nominatives que pour un compte', async () => {
      const anonyme = await request(app).get('/api/classement/stats/globales');
      expect(anonyme.status).toBe(200);
      expect(anonyme.body.data.totaux).toBeDefined();
      expect(anonyme.body.data.records).toBeUndefined();
      expect(anonyme.body.data.activiteRecente).toBeUndefined();
      expect(JSON.stringify(anonyme.body)).not.toMatch(/alice|bob|mallory/);

      const authentifie = await request(app)
        .get('/api/classement/stats/globales')
        .set(bearer(alice.token));
      expect(authentifie.body.data.records).toBeDefined();
    });

    test('le recalcul du classement exige un jeton administrateur', async () => {
      const anonyme = await request(app).post('/api/classement/recalculer');
      expect(anonyme.status).toBe(401);

      const utilisateur = await request(app).post('/api/classement/recalculer').set(bearer(alice.token));
      expect(utilisateur.status).toBe(401);

      const admin = await request(app).post('/api/classement/recalculer').set(bearer(adminToken()));
      expect(admin.status).toBe(200);
    });

    test('un jeton utilisateur ne vaut pas jeton administrateur', async () => {
      const response = await request(app).get('/api/admin/duellistes').set(bearer(alice.token));
      expect(response.status).toBe(401);
    });

    test('les opérations de base restent refusées sans jeton admin', async () => {
      const response = await request(app).get('/api/admin/database/config');
      expect(response.status).toBe(401);
    });
  });

  describe('invitations', () => {
    test('un utilisateur ne voit que ses propres invitations, sans métadonnées de tracking', async () => {
      await prisma.emailInvitation.create({
        data: {
          email: 'cible@example.test',
          inviterId: alice.id,
          status: 'SENT',
          ipAddress: '10.0.0.0',
          userAgent: 'agent-interne',
          expiresAt: new Date(Date.now() + 86400000)
        }
      });

      const reponseTiers = await request(app).get('/api/invitations/my-invitations').set(bearer(mallory.token));
      expect(reponseTiers.body.data).toHaveLength(0);

      const reponseProprietaire = await request(app).get('/api/invitations/my-invitations').set(bearer(alice.token));
      expect(reponseProprietaire.body.data).toHaveLength(1);
      expect(reponseProprietaire.body.data[0].ipAddress).toBeUndefined();
      expect(reponseProprietaire.body.data[0].userAgent).toBeUndefined();
    });
  });
});
