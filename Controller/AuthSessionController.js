// backend/Controller/AuthSessionController.js
const CoursSession = require('../Models/CoursSession');
const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');

/**
 * POST /api/auth/session-login
 * Body { sessionId, password }
 * Header Authorization: Bearer <JWT utilisateur>
 */
async function sessionLogin(req, res) {
  try {
    const userId    = req.user.id;
    const { sessionId, password } = req.body;

    if (!sessionId || !password) {
      return res.status(400).json({ message: 'sessionId et password obligatoires' });
    }

    // 1️⃣ On récupère la session
    const session = await CoursSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session introuvable' });
    }

    // 2️⃣ On cherche le participant
    const participant = session.participants.find(p =>
      p.user_id.toString() === userId
    );
    if (!participant) {
      return res.status(403).json({ message: 'Vous n’êtes pas inscrit à cette session' });
    }

    // ← NOUVEAU : on s’assure qu’un hash est bien stocké
    const hash = participant.sessionPasswordHash;
    if (!hash) {
      return res.status(400).json({
        message: 'Aucun mot de passe de session défini. Veuillez vous réinscrire.'
      });
    }

    // 3️⃣ On compare le mot de passe de session
    const match = await bcrypt.compare(password, hash);
    if (!match) {
      return res.status(400).json({ message: 'Mot de passe de session incorrect' });
    }

    // 4️⃣ Tout est OK => on émet un JWT “de session”
    const payload = { userId, sessionId };
    const tokenSession = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      message:    'Connexion à la session réussie',
      tokenSession,
      accessLink: `${process.env.FRONTEND_URL}/sessions/${sessionId}`
    });

  } catch (err) {
    console.error('sessionLogin error', err);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
}

module.exports = { sessionLogin };
