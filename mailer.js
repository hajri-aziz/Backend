const nodemailer = require('nodemailer');

// Configurer le transporteur d'email
const transporter = nodemailer.createTransport({
    service: 'gmail', // ou un autre service comme Outlook, Yahoo, etc.
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Fonction pour envoyer un email
const sendEmail = async (options) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email envoyé :', info.response);
        return { success: true };
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email :', error);
        return { success: false };
    }
};

// Templates d'email améliorés
const emailTemplates = {
    inscription: (email, sessionInfo) => ({
        to: email,
        subject: `Inscription confirmée pour ${sessionInfo.title}`,
        text: `Vous êtes inscrit à la session ${sessionInfo.title} qui commence le ${new Date(sessionInfo.startdate).toLocaleString()}.`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #4a4a4a;">Confirmation d'inscription</h2>
            <p>Bonjour,</p>
            <p>Nous sommes heureux de vous confirmer votre inscription à la session :</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 15px 0;">
                <h3 style="color: #3a86ff; margin-top: 0;">${sessionInfo.title}</h3>
                <p><strong>Date de début :</strong> ${new Date(sessionInfo.startdate).toLocaleString()}</p>
                <p><strong>Date de fin :</strong> ${new Date(sessionInfo.enddate).toLocaleString()}</p>
                <p><strong>Lieu :</strong> ${sessionInfo.location || 'Non spécifié'}</p>
            </div>
            <p>Vous recevrez un rappel 24 heures avant le début de la session.</p>
            <p>Merci de votre confiance et à bientôt !</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #777;">Ceci est un email automatique, merci de ne pas y répondre.</p>
        </div>
        `
    }),
    
    scheduleChange: (email, sessionInfo, changes) => ({
        to: email,
        subject: `Changements dans la session ${sessionInfo.title}`,
        text: `Les changements suivants ont été effectués : ${changes.join(', ')}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #4a4a4a;">Modification de votre session</h2>
            <p>Bonjour,</p>
            <p>Des modifications ont été apportées à la session <strong>${sessionInfo.title}</strong> :</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 15px 0;">
                <h3 style="color: #3a86ff; margin-top: 0;">Changements effectués</h3>
                <ul style="padding-left: 20px;">
                    ${changes.map(change => `<li style="margin-bottom: 8px;">${change}</li>`).join('')}
                </ul>
            </div>
            <p>Si ces changements vous posent problème, n'hésitez pas à nous contacter.</p>
            <p>Merci de votre compréhension.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #777;">Ceci est un email automatique, merci de ne pas y répondre.</p>
        </div>
        `
    }),
    
    reminder: (email, sessionInfo) => ({
        to: email,
        subject: `Rappel pour la session ${sessionInfo.title}`,
        text: `La session ${sessionInfo.title} commence bientôt le ${new Date(sessionInfo.startdate).toLocaleString()}.`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: #4a4a4a;">Rappel - Votre session commence demain</h2>
            <p>Bonjour,</p>
            <p>Nous vous rappelons que votre session commence bientôt :</p>
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 15px 0;">
                <h3 style="color: #3a86ff; margin-top: 0;">${sessionInfo.title}</h3>
                <p><strong>Date de début :</strong> ${new Date(sessionInfo.startdate).toLocaleString()}</p>
                <p><strong>Lieu :</strong> ${sessionInfo.location || 'Non spécifié'}</p>
            </div>
            <p>Nous vous attendons avec impatience!</p>
            <p>À bientôt !</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #777;">Ceci est un email automatique, merci de ne pas y répondre.</p>
        </div>
        `
    })
};

// Fonction pour programmer des rappels
const scheduleReminder = (email, sessionInfo) => {
    console.log(`Rappel programmé pour ${email} concernant la session ${sessionInfo.title}`);
    // Ici vous pourriez implémenter une logique pour programmer réellement l'envoi du rappel
    // Par exemple avec node-schedule ou une autre bibliothèque
};

module.exports = {
    sendEmail,
    emailTemplates,
    scheduleReminder
};