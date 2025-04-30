// BACKEND/utils/emailTemplates.js
const emailTemplates = {
    inscription: (sessionInfo) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #4a4a4a;">Confirmation d'inscription</h2>
          <p>Bonjour,</p>
          <p>Nous sommes heureux de vous confirmer votre inscription à la session :</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 15px 0;">
              <h3 style="color: #3a86ff; margin-top: 0;">${sessionInfo.title}</h3>
              <p><strong>Date de début :</strong> ${new Date(sessionInfo.startdate).toLocaleString()}</p>
              <p><strong>Date de fin :</strong> ${new Date(sessionInfo.enddate).toLocaleString()}</p>
              <p><strong>Lieu :</strong> ${sessionInfo.location}</p>
          </div>
          <p>Vous recevrez un rappel 24 heures avant le début de la session.</p>
          <p>Merci de votre confiance et à bientôt !</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">Ceci est un email automatique, merci de ne pas y répondre.</p>
      </div>
    `,
    
    rappel: (sessionInfo) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #4a4a4a;">Rappel - Votre session commence demain</h2>
          <p>Bonjour,</p>
          <p>Nous vous rappelons que votre session commence demain :</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 15px 0;">
              <h3 style="color: #3a86ff; margin-top: 0;">${sessionInfo.title}</h3>
              <p><strong>Date de début :</strong> ${new Date(sessionInfo.startdate).toLocaleString()}</p>
              <p><strong>Lieu :</strong> ${sessionInfo.location}</p>
          </div>
          <p>À bientôt !</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #777;">Ceci est un email automatique, merci de ne pas y répondre.</p>
      </div>
    `
    // Ajoutez d'autres templates selon vos besoins
  };
  
  module.exports = emailTemplates;