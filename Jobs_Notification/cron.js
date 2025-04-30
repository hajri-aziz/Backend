const cron = require('node-cron');
const Notification = require('../Models/Notification');
//const sendSMS = require('../Utils/sendSMS'); // ta fonction d'envoi
const sendEmail = require('../Utils/sendEmail'); // si tu veux aussi envoyer un mail
const User = require('../Models/User');

cron.schedule('*/2 * * * *', async () => {
  console.log("🔁 Vérification des notifications à envoyer...");

  try {
    const now = new Date();

    const notifications = await Notification.find({
      envoye: false,
      date_rappel: { $lte: now }
    });

    for (const notif of notifications) {
      const user = await User.findById(notif.id_patient);

      if (!user) continue;

      // ✅ Envoi du rappel
      //await sendSMS(user.telephone, notif.message);
      await sendEmail(user.email, "Rappel", notif.message);

      notif.envoye = true;
      await notif.save();

      console.log(`✅ Notification envoyée au patient ${user.nom}`);
    }
  } catch (err) {
    console.error("❌ Erreur dans le cron des rappels :", err);
  }
});
