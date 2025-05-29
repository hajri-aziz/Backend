// BACKEND/utils/emailTemplates.js
const emailTemplates = {
  inscription: (email, sessionInfo, loginCredentials) => ({
    to:      email,
    subject: `Confirmation d'inscription – ${sessionInfo.title}`,
    text:    `Vous êtes inscrit à la session '${sessionInfo.title}' du ${new Date(sessionInfo.startdate).toLocaleString()}.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #eee;border-radius:8px;overflow:hidden;">
        <!-- Header avec logo depuis le frontend (URL absolue) -->
        <div style="background:#007299;padding:20px;text-align:center;">
          <img src="http://localhost:4200/assets/logo.png" alt="Logo" style="max-width:120px;">
        </div>
        <!-- Corps -->
        <div style="padding:20px;">
          <h2 style="color:#007299;margin-top:0;">Confirmation d'inscription</h2>
          <p>Bonjour,</p>
          <p>Votre inscription à la session <strong>${sessionInfo.title}</strong> a bien été enregistrée :</p>
          <ul>
            <li><strong>Date de début :</strong> ${new Date(sessionInfo.startdate).toLocaleString()}</li>
            <li><strong>Date de fin :</strong> ${new Date(sessionInfo.enddate).toLocaleString()}</li>
            <li><strong>Lieu :</strong> ${sessionInfo.location || 'Non spécifié'}</li>
            <li><strong>Durée :</strong> ${sessionInfo.duration.amount} ${sessionInfo.duration.unit}</li>
          </ul>
          <p>Vos identifiants de connexion :</p>
          <div style="background:#f0f7ff;padding:15px;border-radius:4px;">
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Mot de passe :</strong> ${loginCredentials.password}</p>
          </div>
          <div style="text-align:center;margin:20px 0;">
            <a href="${sessionInfo.accessLink}" style="background:#007299;color:#fff;padding:10px 20px;text-decoration:none;border-radius:4px;">Accéder à la session</a>
          </div>
        </div>
        <!-- Footer -->
        <div style="background:#f9f9f9;padding:15px;text-align:center;font-size:12px;color:#777;">
          <p>© ${new Date().getFullYear()} Votre Plateforme. Tous droits réservés.</p>
          <p>Contactez-nous : <a href="mailto:support@votreplateforme.com" style="color:#007299;">support@votreplateforme.com</a></p>
          <p>
            <a href="https://facebook.com/votrepage" style="margin:0 5px;color:#007299;">Facebook</a> |
            <a href="https://twitter.com/votretwitter" style="margin:0 5px;color:#007299;">Twitter</a>
          </p>
        </div>
      </div>
    `
  }),

    
    rappel: (userEmail, sessionInfo) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #4a4a4a; text-align: center;">Rappel - Votre session commence bientôt</h2>
          
          <p>Bonjour,</p>
          
          <p>Nous vous rappelons que votre session commence demain :</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 15px 0;">
              <h3 style="color: #3a86ff; margin-top: 0;">${sessionInfo.title}</h3>
              <p><strong>Date :</strong> ${new Date(sessionInfo.startdate).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
              })}</p>
              <p><strong>Lieu :</strong> ${sessionInfo.location || 'En ligne'}</p>
          </div>
          
          <div style="text-align: center; margin: 25px 0;">
              <a href="${sessionInfo.accessLink}" 
                 style="background-color: #3a86ff; color: white; padding: 10px 20px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                  Accéder à la session
              </a>
          </div>
          
          <p>Préparez-vous et n'oubliez pas de tester votre connexion à l'avance.</p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">
              Ceci est un email automatique, merci de ne pas y répondre directement.<br>
              © ${new Date().getFullYear()} Votre Plateforme - Tous droits réservés
          </p>
      </div>
    `,
    
    changementHoraire: (userEmail, sessionInfo, modifications) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #d32f2f; text-align: center;">Modification de votre session</h2>
          
          <p>Bonjour,</p>
          
          <p>Les informations de votre session ont été modifiées :</p>
          
          <div style="background-color: #fff8f8; padding: 15px; border-radius: 4px; margin: 15px 0;">
              <h3 style="color: #d32f2f; margin-top: 0;">${sessionInfo.title}</h3>
              
              <ul style="padding-left: 20px;">
                  ${modifications.map(mod => `<li>${mod}</li>`).join('')}
              </ul>
              
              <p><strong>Nouvelle date :</strong> ${new Date(sessionInfo.startdate).toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
              })}</p>
              ${sessionInfo.location ? `<p><strong>Lieu :</strong> ${sessionInfo.location}</p>` : ''}
          </div>
          
          <p>Nous nous excusons pour la gêne occasionnée.</p>
          
          <div style="text-align: center; margin: 25px 0;">
              <a href="${sessionInfo.accessLink}" 
                 style="background-color: #d32f2f; color: white; padding: 10px 20px; 
                        text-decoration: none; border-radius: 4px; display: inline-block;">
                  Voir les nouvelles informations
              </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">
              Ceci est un email automatique, merci de ne pas y répondre directement.<br>
              © ${new Date().getFullYear()} Votre Plateforme - Tous droits réservés
          </p>
      </div>
    `
};

module.exports = emailTemplates;