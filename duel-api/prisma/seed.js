const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed de la base de données...');

  // Nettoyage des données existantes
  await prisma.validationScore.deleteMany();
  await prisma.duel.deleteMany();
  await prisma.dueliste.deleteMany();

  // Création des duellistes de test
  const duellistes = await Promise.all([
    prisma.dueliste.create({
      data: {
        pseudo: 'ZorroMask',
        avatarUrl: 'https://example.com/avatars/zorro.jpg',
        nbVictoires: 15,
        nbDefaites: 8,
        nbMatchsTotal: 23,
        indiceTouches: 12
      }
    }),
    prisma.dueliste.create({
      data: {
        pseudo: 'LameArgent',
        avatarUrl: 'https://example.com/avatars/argent.jpg',
        nbVictoires: 12,
        nbDefaites: 10,
        nbMatchsTotal: 22,
        indiceTouches: 5
      }
    }),
    prisma.dueliste.create({
      data: {
        pseudo: 'EpeeDeFer',
        avatarUrl: 'https://example.com/avatars/fer.jpg',
        nbVictoires: 18,
        nbDefaites: 5,
        nbMatchsTotal: 23,
        indiceTouches: 25
      }
    }),
    prisma.dueliste.create({
      data: {
        pseudo: 'FleuretMagie',
        avatarUrl: 'https://example.com/avatars/magie.jpg',
        nbVictoires: 8,
        nbDefaites: 12,
        nbMatchsTotal: 20,
        indiceTouches: -8
      }
    }),
    prisma.dueliste.create({
      data: {
        pseudo: 'SabreTempete',
        avatarUrl: 'https://example.com/avatars/tempete.jpg',
        nbVictoires: 20,
        nbDefaites: 3,
        nbMatchsTotal: 23,
        indiceTouches: 30
      }
    }),
    prisma.dueliste.create({
      data: {
        pseudo: 'Pierre D.',
        nbVictoires: 5,
        nbDefaites: 8,
        nbMatchsTotal: 13,
        indiceTouches: -5
      }
    })
  ]);

  console.log(`✅ ${duellistes.length} duellistes créés`);

  // Création de quelques duels de test
  const duels = await Promise.all([
    // Duel validé
    prisma.duel.create({
      data: {
        provocateurId: duellistes[0].id, // ZorroMask
        adversaireId: duellistes[1].id,  // LameArgent
        arbitreId: duellistes[2].id,     // EpeeDeFer
        etat: 'VALIDE',
        dateAcceptation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
        dateValidation: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),  // Il y a 1 jour
        scoreProvocateur: 15,
        scoreAdversaire: 12,
        vainqueurId: duellistes[0].id,
        valideParArbitre: true,
        notes: 'Excellent duel, très technique!'
      }
    }),
    
    // Duel en attente de validation
    prisma.duel.create({
      data: {
        provocateurId: duellistes[3].id, // FleuretMagie
        adversaireId: duellistes[4].id,  // SabreTempete
        etat: 'EN_ATTENTE_VALIDATION',
        dateAcceptation: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        scoreProvocateur: 8,
        scoreAdversaire: 15,
        vainqueurId: duellistes[4].id,
        valideParProvocateur: true,
        valideParAdversaire: false
      }
    }),
    
    // Duel proposé
    prisma.duel.create({
      data: {
        provocateurId: duellistes[5].id, // Pierre D.
        adversaireId: duellistes[2].id,  // EpeeDeFer
        etat: 'PROPOSE',
        notes: 'Défi pour améliorer mon niveau!'
      }
    }),
    
    // Duel accepté et programmé
    prisma.duel.create({
      data: {
        provocateurId: duellistes[1].id, // LameArgent
        adversaireId: duellistes[3].id,  // FleuretMagie
        etat: 'A_JOUER',
        dateAcceptation: new Date(),
        dateProgrammee: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Dans 2 jours
        notes: 'RDV salle 2, 18h30'
      }
    })
  ]);

  console.log(`✅ ${duels.length} duels créés`);

  // Création de validations de score pour le duel en attente
  await prisma.validationScore.create({
    data: {
      matchId: duels[1].id,
      duelisteId: duellistes[3].id, // FleuretMagie
      scoreProvocateur: 8,
      scoreAdversaire: 15
    }
  });

  console.log('✅ Validations de score créées');
  console.log('🎉 Seed terminé avec succès!');
  
  // Affichage du résumé
  const stats = await prisma.dueliste.findMany({
    include: {
      _count: {
        select: {
          duelsProvoques: true,
          duelsRecus: true
        }
      }
    }
  });
  
  console.log('\n📊 Résumé des données:');
  stats.forEach(dueliste => {
    console.log(`- ${dueliste.pseudo}: ${dueliste.nbVictoires}V/${dueliste.nbDefaites}D (${dueliste._count.duelsProvoques + dueliste._count.duelsRecus} duels)`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });