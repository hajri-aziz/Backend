const express = require('express');
const router = express.Router();
const { sendEmail, emailTemplates } = require('../mailer'); // Ajustez le chemin selon votre structure de projet

router.post('/test-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ message: "Email requis" });
        }
        
        const testSessionInfo = {
            title: "Session de test",
            startdate: new Date().toLocaleString(),
            enddate: new Date(Date.now() + 3600000).toLocaleString(), // +1 heure
            location: "Salle de test"
        };
        
        const emailOptions = emailTemplates.inscription(email, testSessionInfo);
        const result = await sendEmail(emailOptions);
        
        if (result.success) {
            res.status(200).json({ message: "Email de test envoyé avec succès" });
        } else {
            res.status(500).json({ message: "Échec de l'envoi de l'email de test" });
        }
    } catch (error) {
        console.error("Erreur lors du test d'email:", error);
        res.status(500).json({ message: "Erreur serveur lors du test d'email" });
    }
});

module.exports = router;