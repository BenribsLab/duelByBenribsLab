const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

/**
 * Service d'administration pour la gestion des utilisateurs
 */
class AdminService {
  
  /**
   * Normaliser un email (trim + lowercase + gérer les points Gmail)
   */
  normalizeEmail(email) {
    if (!email) return null;
    const trimmedEmail = email.trim().toLowerCase();
    
    // Pour Gmail, supprimer les points avant l'@
    if (trimmedEmail.endsWith('@gmail.com')) {
      const [localPart, domain] = trimmedEmail.split('@');
      return localPart.replace(/\./g, '') + '@' + domain;
    }
    
    return trimmedEmail;
  }

  /**
   * Générer un code OTP
   */
  generateOTP() {
    const length = parseInt(process.env.OTP_LENGTH) || 6;
    return crypto.randomInt(100000, 999999).toString().padStart(length, '0');
  }

  /**
   * Lister tous les utilisateurs avec pagination
   */
  async getAllUsers(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    try {
      const [users, total] = await Promise.all([
        prisma.dueliste.findMany({
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            pseudo: true,
            email: true,
            authMode: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            // Exclure les champs sensibles
            // passwordHash: false,
            // otpCode: false
          }
        }),
        prisma.dueliste.count()
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw new Error('Impossible de récupérer la liste des utilisateurs');
    }
  }

  /**
   * Obtenir un utilisateur par ID
   */
  async getUserById(userId) {
    try {
      const user = await prisma.dueliste.findUnique({
        where: { id: parseInt(userId) },
        select: {
          id: true,
          pseudo: true,
          email: true,
          authMode: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      return user;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un utilisateur
   */
  async updateUser(userId, updateData) {
    try {
      const { pseudo, email, password, authMode } = updateData;
      
      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.dueliste.findUnique({
        where: { id: parseInt(userId) }
      });

      if (!existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Préparer les données de mise à jour
      const dataToUpdate = {};

      if (pseudo && pseudo !== existingUser.pseudo) {
        // Vérifier que le pseudo n'est pas déjà utilisé
        const pseudoExists = await prisma.dueliste.findFirst({
          where: {
            pseudo,
            id: { not: parseInt(userId) }
          }
        });

        if (pseudoExists) {
          throw new Error('Ce pseudo est déjà utilisé');
        }

        dataToUpdate.pseudo = pseudo;
      }

      if (email !== undefined) {
        // Normaliser l'email
        const normalizedEmail = this.normalizeEmail(email);
        
        if (normalizedEmail !== existingUser.email) {
          if (normalizedEmail) {
            // Vérifier que l'email n'est pas déjà utilisé
            const emailExists = await prisma.dueliste.findFirst({
              where: {
                email: normalizedEmail,
                id: { not: parseInt(userId) }
              }
            });

            if (emailExists) {
              throw new Error('Cet email est déjà utilisé');
            }
          }

          dataToUpdate.email = normalizedEmail;
          dataToUpdate.emailVerified = normalizedEmail ? false : true;
        }
      }

      if (password) {
        // Hasher le nouveau mot de passe
        dataToUpdate.passwordHash = await bcrypt.hash(password, 12);
        // Si on définit un mot de passe, basculer en mode PASSWORD
        dataToUpdate.authMode = 'PASSWORD';
      }

      if (authMode && authMode !== existingUser.authMode) {
        dataToUpdate.authMode = authMode;
        
        // Si on passe en mode OTP, s'assurer qu'il y a un email
        if (authMode === 'OTP' && !email && !existingUser.email) {
          throw new Error('Un email est requis pour le mode OTP');
        }
      }

      // Mettre à jour l'utilisateur
      const updatedUser = await prisma.dueliste.update({
        where: { id: parseInt(userId) },
        data: dataToUpdate,
        select: {
          id: true,
          pseudo: true,
          email: true,
          authMode: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return updatedUser;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Supprimer un utilisateur
   */
  async deleteUser(userId) {
    try {
      // Vérifier que l'utilisateur existe
      const existingUser = await prisma.dueliste.findUnique({
        where: { id: parseInt(userId) }
      });

      if (!existingUser) {
        throw new Error('Utilisateur non trouvé');
      }

      // Supprimer l'utilisateur (cela supprimera aussi ses duels grâce à la cascade)
      await prisma.dueliste.delete({
        where: { id: parseInt(userId) }
      });

      return {
        success: true,
        message: `Utilisateur ${existingUser.pseudo} supprimé avec succès`
      };
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Supprimer plusieurs utilisateurs
   */
  async deleteMultipleUsers(userIds) {
    try {
      const deletedCount = await prisma.dueliste.deleteMany({
        where: {
          id: {
            in: userIds.map(id => parseInt(id))
          }
        }
      });

      return {
        success: true,
        message: `${deletedCount.count} utilisateur(s) supprimé(s) avec succès`,
        deletedCount: deletedCount.count
      };
    } catch (error) {
      console.error('Erreur lors de la suppression multiple:', error);
      throw new Error('Impossible de supprimer les utilisateurs sélectionnés');
    }
  }

  /**
   * Obtenir les statistiques des utilisateurs
   */
  async getUserStats() {
    try {
      const [total, passwordUsers, otpUsers, verifiedEmails] = await Promise.all([
        prisma.dueliste.count(),
        prisma.dueliste.count({ where: { authMode: 'PASSWORD' } }),
        prisma.dueliste.count({ where: { authMode: 'OTP' } }),
        prisma.dueliste.count({ where: { emailVerified: true } })
      ]);

      return {
        totalUsers: total,
        verifiedUsers: verifiedEmails,
        passwordUsers: passwordUsers,
        activeUsers: total, // Pour l'instant, on considère tous les utilisateurs comme actifs
        otpUsers: otpUsers
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw new Error('Impossible de récupérer les statistiques');
    }
  }

  /**
   * Créer un nouvel utilisateur (via l'interface admin)
   */
  async createUserByAdmin(userData) {
    try {
      const { pseudo, email, password, authMode, autoValidate = true } = userData;

      // Normaliser l'email
      const normalizedEmail = this.normalizeEmail(email);

      // Validation des données
      if (!pseudo) {
        throw new Error('Le pseudo est requis');
      }

      if (!authMode || !['PASSWORD', 'OTP'].includes(authMode)) {
        throw new Error('Mode d\'authentification invalide (PASSWORD ou OTP)');
      }

      if (authMode === 'PASSWORD' && !password) {
        throw new Error('Le mot de passe est requis pour le mode PASSWORD');
      }

      if (authMode === 'OTP' && !normalizedEmail) {
        throw new Error('L\'email est requis pour le mode OTP');
      }

      // Vérifier si le pseudo existe déjà
      const existingUser = await prisma.dueliste.findUnique({
        where: { pseudo }
      });

      if (existingUser) {
        throw new Error('Ce pseudo est déjà utilisé');
      }

      // Vérifier si l'email existe déjà (si fourni)
      if (normalizedEmail) {
        const existingEmail = await prisma.dueliste.findUnique({
          where: { email: normalizedEmail }
        });

        if (existingEmail) {
          throw new Error('Cet email est déjà utilisé');
        }
      }

      // Préparer les données utilisateur
      const userData_creation = {
        pseudo,
        email: normalizedEmail,
        authMode,
        emailVerified: autoValidate || !normalizedEmail, // Auto-valider si demandé ou si pas d'email
      };

      // Hasher le mot de passe si mode PASSWORD
      if (authMode === 'PASSWORD' && password) {
        userData_creation.passwordHash = await bcrypt.hash(password, 12);
      }

      // Générer un OTP si mode OTP
      if (authMode === 'OTP') {
        const otpCode = this.generateOTP();
        const otpExpiry = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000);
        userData_creation.otpCode = otpCode;
        userData_creation.otpExpiry = otpExpiry;
      }

      // Créer l'utilisateur
      const user = await prisma.dueliste.create({
        data: userData_creation,
        select: {
          id: true,
          pseudo: true,
          email: true,
          authMode: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return user;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Rechercher des utilisateurs
   */
  async searchUsers(query, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    try {
      const whereClause = {
        OR: [
          { pseudo: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      };

      const [users, total] = await Promise.all([
        prisma.dueliste.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            pseudo: true,
            email: true,
            authMode: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true
          }
        }),
        prisma.dueliste.count({ where: whereClause })
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        query
      };
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      throw new Error('Impossible d\'effectuer la recherche');
    }
  }
}

module.exports = new AdminService();