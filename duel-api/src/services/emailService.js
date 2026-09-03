const { Client } = require('@microsoft/microsoft-graph-client');
const { ConfidentialClientApplication } = require('@azure/msal-node');
const { createTrackingToken } = require('../utils/trackingToken');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Service d'envoi d'emails via Microsoft Graph
 */
class EmailService {
  constructor() {
    this.clientApp = null;
    this.senderEmail = process.env.GRAPH_SENDER_EMAIL;
    this.senderName = process.env.GRAPH_SENDER_NAME || 'Duel By Benribs Lab';
  }

  /**
   * Client MSAL créé à la demande : une configuration Graph absente ne doit pas
   * empêcher l'API de démarrer, seulement faire échouer l'envoi d'emails.
   */
  getClientApp() {
    if (!this.clientApp) {
      this.clientApp = new ConfidentialClientApplication({
        auth: {
          clientId: process.env.AZURE_CLIENT_ID,
          clientSecret: process.env.AZURE_CLIENT_SECRET,
          authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`
        }
      });
    }
    return this.clientApp;
  }

  /**
   * Obtenir un token d'accès pour Microsoft Graph
   */
  async getAccessToken() {
    try {
      const clientCredentialRequest = {
        scopes: ['https://graph.microsoft.com/.default'],
      };

      const response = await this.getClientApp().acquireTokenByClientCredential(clientCredentialRequest);
      return response.accessToken;
    } catch (error) {
      console.error('Erreur lors de l\'obtention du token d\'accès:', error);
      throw new Error('Impossible d\'obtenir le token d\'accès Microsoft Graph');
    }
  }

  /**
   * Créer un client Graph authentifié
   */
  async getGraphClient() {
    const accessToken = await this.getAccessToken();
    
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
  }

  /**
   * Envoyer un email de code OTP
   */
  async sendOTPEmail(recipientEmail, otpCode, recipientName = null) {
    try {
      const graphClient = await this.getGraphClient();
      
      const message = {
        message: {
          subject: '🔐 Code de vérification - Duel By Benribs Lab',
          body: {
            contentType: 'HTML',
            content: this.generateOTPEmailHTML(otpCode, recipientName)
          },
          toRecipients: [
            {
              emailAddress: {
                address: recipientEmail,
                name: recipientName || recipientEmail
              }
            }
          ],
          from: {
            emailAddress: {
              address: this.senderEmail,
              name: this.senderName
            }
          }
        },
        saveToSentItems: false
      };

      await graphClient.api(`/users/${this.senderEmail}/sendMail`).post(message);
      
      console.log(`Email OTP envoyé avec succès à ${recipientEmail}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email OTP:', error);
      throw new Error('Impossible d\'envoyer l\'email de vérification');
    }
  }

  /**
   * Générer le contenu HTML de l'email OTP
   */
  generateOTPEmailHTML(otpCode, recipientName) {
    const displayName = recipientName ? `Bonjour ${escapeHtml(recipientName)}` : 'Bonjour';
    const safeOTP = escapeHtml(otpCode);
    
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Code de vérification</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 20px;
          }
          .otp-code {
            background: #f1f5f9;
            border: 2px dashed #3b82f6;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
          }
          .code {
            font-size: 32px;
            font-weight: bold;
            color: #1e40af;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
          }
          .warning {
            background: #fef3cd;
            border: 1px solid #fbbf24;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #92400e;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚔️ Duel By Benribs Lab</div>
            <h1 style="color: #1f2937; margin: 0;">Code de vérification</h1>
          </div>
          
          <p>${displayName},</p>
          
          <p>Vous avez demandé à vous connecter à votre compte Duel. Utilisez le code de vérification ci-dessous :</p>
          
          <div class="otp-code">
            <p style="margin: 0 0 10px 0; color: #374151; font-weight: 500;">Votre code de vérification :</p>
            <div class="code">${safeOTP}</div>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important :</strong>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>Ce code expire dans <strong>${process.env.OTP_EXPIRY_MINUTES || 10} minutes</strong></li>
              <li>Ne partagez jamais ce code avec quelqu'un d'autre</li>
              <li>Si vous n'avez pas demandé ce code, ignorez cet email</li>
            </ul>
          </div>
          
          <p>Si vous rencontrez des problèmes, contactez l'administrateur du club d'escrime.</p>
          
          <div class="footer">
            <p><strong>Duel By Benribs Lab</strong><br>
            Système de gestion des duels d'escrime<br>
            <a href="mailto:${this.senderEmail}" style="color: #3b82f6;">${this.senderEmail}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Envoyer un email de bienvenue (optionnel)
   */
  async sendWelcomeEmail(recipientEmail, recipientName, isOTPMode = false) {
    try {
      const graphClient = await this.getGraphClient();
      
      const message = {
        message: {
          subject: '🎉 Bienvenue dans Duel By Benribs Lab !',
          body: {
            contentType: 'HTML',
            content: this.generateWelcomeEmailHTML(recipientName, isOTPMode)
          },
          toRecipients: [
            {
              emailAddress: {
                address: recipientEmail,
                name: recipientName || recipientEmail
              }
            }
          ],
          from: {
            emailAddress: {
              address: this.senderEmail,
              name: this.senderName
            }
          }
        },
        saveToSentItems: false
      };

      await graphClient.api(`/users/${this.senderEmail}/sendMail`).post(message);
      
      console.log(`Email de bienvenue envoyé à ${recipientEmail}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', error);
      // Ne pas faire échouer l'inscription si l'email de bienvenue échoue
      return false;
    }
  }

  /**
   * Générer le contenu HTML de l'email de bienvenue
   */
  generateWelcomeEmailHTML(recipientName, isOTPMode) {
    const displayName = escapeHtml(recipientName || 'Escrimeur');
    const authMethod = isOTPMode ? 'codes par email' : 'mot de passe';
    
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenue</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 20px;
          }
          .features {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚔️ Duel By Benribs Lab</div>
            <h1 style="color: #1f2937; margin: 0;">Bienvenue ${displayName} !</h1>
          </div>
          
          <p>Félicitations ! Votre compte a été créé avec succès.</p>
          
          <div class="features">
            <h3 style="color: #059669; margin-top: 0;">🎯 Ce que vous pouvez faire :</h3>
            <ul style="margin: 10px 0;">
              <li><strong>Gérer vos duels</strong> - Enregistrez vos combats et résultats</li>
              <li><strong>Suivre votre progression</strong> - Consultez vos statistiques</li>
              <li><strong>Découvrir le classement</strong> - Voyez votre position parmi les escrimeurs</li>
              <li><strong>Défier d'autres duellistes</strong> - Organisez vos prochains combats</li>
            </ul>
          </div>
          
          <p><strong>Mode de connexion configuré :</strong> ${authMethod}</p>
          
          <p>Vous pouvez maintenant vous connecter et commencer à utiliser l'application !</p>
          
          <div class="footer">
            <p><strong>Duel By Benribs Lab</strong><br>
            Système de gestion des duels d'escrime<br>
            <a href="mailto:${this.senderEmail}" style="color: #3b82f6;">${this.senderEmail}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Envoyer un email d'invitation de duel avec tracking
   */
  async sendInvitationEmail(recipientEmail, inviterName, inviterPseudo, recipientName = null, invitationId = null, expiresAt = null) {
    try {
      const graphClient = await this.getGraphClient();
      
      const message = {
        message: {
          subject: `⚔️ ${inviterPseudo} vous invite à rejoindre Duel By Benribs Lab !`,
          body: {
            contentType: 'HTML',
            content: this.generateInvitationEmailHTML(inviterName, inviterPseudo, recipientName, invitationId, expiresAt)
          },
          toRecipients: [
            {
              emailAddress: {
                address: recipientEmail,
                name: recipientName || recipientEmail
              }
            }
          ],
          from: {
            emailAddress: {
              address: this.senderEmail,
              name: this.senderName
            }
          }
        },
        saveToSentItems: false
      };

      await graphClient.api(`/users/${this.senderEmail}/sendMail`).post(message);
      
      console.log(`Email d'invitation envoyé avec succès à ${recipientEmail} par ${inviterPseudo}${invitationId ? ` (ID: ${invitationId})` : ''}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email d\'invitation:', error);
      throw new Error('Impossible d\'envoyer l\'email d\'invitation');
    }
  }

  /**
   * Générer le contenu HTML de l'email d'invitation avec tracking
   */
  generateInvitationEmailHTML(inviterName, inviterPseudo, recipientName, invitationId = null, expiresAt = null) {
    const rawInviterPseudo = inviterPseudo;
    const displayName = recipientName ? `Bonjour ${escapeHtml(recipientName)}` : 'Bonjour';
    const appUrl = process.env.FRONTEND_URL || 'https://duel.benribs.fr';
    const apiUrl = process.env.API_URL || 'https://api-duel.benribs.fr';
    const trackingToken = invitationId
      ? createTrackingToken(invitationId, expiresAt || Date.now() + 30 * 24 * 60 * 60 * 1000)
      : null;
    
    // URLs avec tracking si on a un ID d'invitation
    const trackingPixelUrl = trackingToken ? `${apiUrl}/api/track/email-open/${trackingToken}` : null;
    const trackedSignupUrl = trackingToken
      ? `${apiUrl}/api/track/invitation-click/${trackingToken}`
      : `${appUrl}/register?invitedBy=${encodeURIComponent(rawInviterPseudo)}`;
    inviterPseudo = escapeHtml(inviterPseudo);
    
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invitation Duel</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .container {
            background: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 20px;
          }
          .invitation-card {
            background: #fef2f2;
            border: 2px solid #fecaca;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .inviter {
            font-size: 20px;
            font-weight: bold;
            color: #dc2626;
            margin: 10px 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
            color: white;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            transition: transform 0.2s;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .features {
            background: #f0fdf4;
            border-left: 4px solid #10b981;
            padding: 20px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚔️ Duel By Benribs Lab</div>
            <h1 style="color: #1f2937; margin: 0;">Vous êtes invité(e) !</h1>
          </div>
          
          <p>${displayName},</p>
          
          <div class="invitation-card">
            <p style="margin: 0; font-size: 16px;">🏅 Vous avez été invité(e) par</p>
            <div class="inviter">${inviterPseudo}</div>
            <p style="margin: 0; color: #6b7280;">à rejoindre notre communauté d'escrimeurs !</p>
          </div>
          
          <p>Rejoignez notre plateforme de gestion des duels d'escrime et commencez à défier d'autres escrimeurs !</p>
          
          <div style="text-align: center;">
            <a href="${trackedSignupUrl}" class="cta-button">
              🎯 Rejoindre maintenant
            </a>
          </div>
          
          <div class="features">
            <h3 style="color: #059669; margin-top: 0;">⚔️ Ce qui vous attend :</h3>
            <ul style="margin: 10px 0;">
              <li><strong>Gérez vos duels</strong> - Enregistrez vos combats et résultats</li>
              <li><strong>Suivez votre progression</strong> - Consultez vos statistiques détaillées</li>
              <li><strong>Classement en temps réel</strong> - Voyez votre position parmi les escrimeurs</li>
              <li><strong>Défiez d'autres duellistes</strong> - Organisez vos prochains combats</li>
              <li><strong>Communauté active</strong> - Rejoignez ${inviterPseudo} et d'autres passionnés</li>
            </ul>
          </div>
          
          <p>L'inscription est gratuite et ne prend que quelques secondes !</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${trackedSignupUrl}" class="cta-button">
              ✨ Commencer l'aventure
            </a>
          </div>
          
          <div class="footer">
            <p><strong>Duel By Benribs Lab</strong><br>
            Système de gestion des duels d'escrime<br>
            <a href="mailto:${this.senderEmail}" style="color: #3b82f6;">${this.senderEmail}</a></p>
            
            <p style="font-size: 12px; color: #9ca3af; margin-top: 20px;">
              Vous recevez cet email car ${inviterPseudo} vous a invité(e) à rejoindre notre plateforme.
              Si vous ne souhaitez pas vous inscrire, vous pouvez ignorer cet email.
            </p>
          </div>
        </div>
        
        ${trackingPixelUrl ? `<img src="${trackingPixelUrl}" alt="" style="display:none; width:1px; height:1px;">` : ''}
      </body>
      </html>
    `;
  }

  /**
   * Notifier l'administrateur d'un signalement (contenu ou comportement).
   * Best-effort : l'échec de cet envoi ne doit jamais faire échouer le
   * signalement lui-même (déjà enregistré en base à ce stade).
   */
  async sendReportNotificationEmail({ reporterPseudo, reportedPseudo, duelId, message }) {
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!adminEmail) {
      console.warn('ADMIN_NOTIFICATION_EMAIL non configuré : signalement enregistré, mais aucun e-mail envoyé.');
      return false;
    }

    try {
      const graphClient = await this.getGraphClient();

      const contexteDuel = duelId ? `Duel #${escapeHtml(String(duelId))}` : 'Hors contexte de duel';

      const mail = {
        message: {
          subject: `🚩 Signalement : ${reporterPseudo} → ${reportedPseudo}`,
          body: {
            contentType: 'HTML',
            content: `
              <p><strong>${escapeHtml(reporterPseudo)}</strong> a signalé <strong>${escapeHtml(reportedPseudo)}</strong>.</p>
              <p>${contexteDuel}</p>
              <p>Message du signalement :</p>
              <blockquote style="border-left:3px solid #ccc;padding-left:10px;color:#333;">
                ${escapeHtml(message)}
              </blockquote>
            `
          },
          toRecipients: [{ emailAddress: { address: adminEmail } }],
          from: { emailAddress: { address: this.senderEmail, name: this.senderName } }
        },
        saveToSentItems: false
      };

      await graphClient.api(`/users/${this.senderEmail}/sendMail`).post(mail);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de signalement:', error.message);
      return false;
    }
  }

  /**
   * Demander au parent d'un compte Junior l'autorisation d'inscription.
   * Contrairement au lien de suivi, le clic n'exécute rien : il amène sur une
   * page de confirmation, pour ne pas risquer qu'un scanner anti-hameçonnage
   * de la messagerie déclenche la décision en pré-chargeant le lien.
   */
  async sendParentalConsentRequestEmail(parentEmail, childPseudo, decisionUrl) {
    try {
      const graphClient = await this.getGraphClient();

      const message = {
        message: {
          subject: `🧒 Autorisation demandée pour ${escapeHtml(childPseudo)} - Duel By Benribs Lab`,
          body: {
            contentType: 'HTML',
            content: `
              <p>Bonjour,</p>
              <p><strong>${escapeHtml(childPseudo)}</strong> souhaite créer un compte sur Duel By Benribs Lab
              (application de suivi de duels d'escrime) et a indiqué votre adresse comme responsable légal.</p>
              <p>Le compte reste inactif tant que vous n'avez pas répondu.</p>
              <p><a href="${escapeHtml(decisionUrl)}" style="background:#7c3aed;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Examiner la demande</a></p>
              <p style="color:#666;font-size:12px;">Ce lien expire dans 30 jours. Si vous n'êtes pas à l'origine de cette
              demande, vous pouvez l'ignorer ou la refuser sans conséquence.</p>
            `
          },
          toRecipients: [{ emailAddress: { address: parentEmail } }],
          from: { emailAddress: { address: this.senderEmail, name: this.senderName } }
        },
        saveToSentItems: false
      };

      await graphClient.api(`/users/${this.senderEmail}/sendMail`).post(message);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande de consentement parental:', error.message);
      throw new Error('Impossible d\'envoyer l\'e-mail au parent');
    }
  }

  /**
   * Notifier l'administrateur qu'un parent a donné son accord et qu'une
   * validation finale est attendue. Best-effort : ne doit jamais faire
   * échouer la décision du parent, déjà enregistrée à ce stade.
   */
  async sendParentalConsentAdminReviewEmail(adminEmail, childPseudo, parentEmail, decisionUrl) {
    try {
      const graphClient = await this.getGraphClient();

      const message = {
        message: {
          subject: `✅ Consentement parental reçu pour ${escapeHtml(childPseudo)}`,
          body: {
            contentType: 'HTML',
            content: `
              <p>Le parent (${escapeHtml(parentEmail)}) de <strong>${escapeHtml(childPseudo)}</strong> a donné son accord.</p>
              <p>Validation finale requise avant activation du compte.</p>
              <p><a href="${escapeHtml(decisionUrl)}" style="background:#7c3aed;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Examiner et valider</a></p>
            `
          },
          toRecipients: [{ emailAddress: { address: adminEmail } }],
          from: { emailAddress: { address: this.senderEmail, name: this.senderName } }
        },
        saveToSentItems: false
      };

      await graphClient.api(`/users/${this.senderEmail}/sendMail`).post(message);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification admin (consentement parental):', error.message);
      return false;
    }
  }

  /**
   * Tester la configuration email
   */
  async testEmailConfiguration() {
    try {
      await this.getAccessToken();
      console.log('✅ Configuration Microsoft Graph valide');
      return true;
    } catch (error) {
      console.error('❌ Erreur de configuration Microsoft Graph:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();
