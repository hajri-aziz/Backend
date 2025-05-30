// backend/services/mailer.js
const nodemailer     = require('nodemailer');
const path           = require('path');
const emailTemplates = require('./emailTemplates'); // <— chemin adapté

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: { rejectUnauthorized: false }
});

async function sendEmail(options) {
  try {
    const info = await transporter.sendMail({
      from:    process.env.SMTP_USER,
      to:      options.to,
      subject: options.subject,
      text:    options.text,
      html:    options.html
      // plus d'attachments, si vous choisissez l'option inline/CID
    });
    console.log('Email envoyé :', info.response);
    return { success: true };
  } catch (err) {
    console.error('Erreur sendEmail :', err);
    return { success: false, error: err };
  }
}

function scheduleReminder(email, sessionInfo) {
  console.log(`Rappel planifié pour ${email} – session : ${sessionInfo.title}`);
}

module.exports = {
  sendEmail,
  emailTemplates,
  scheduleReminder
};
