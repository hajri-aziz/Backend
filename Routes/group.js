// Routes/group.js

const express = require("express");
const router = express.Router();
const { authMiddleware ,checkRole} = require('../Middll/authMiddleware');  // Vérifie que ton middleware d'authentification est correct
const socketController = require('../Controller/ForumController');  // Assure-toi que ton contrôleur est correctement importé
const User = require('../Models/User');  // Assure-toi que ton modèle User est correctement importé

// Assure-toi que ton contrôleur est correctement importé

// Routes pour les messages
router.get('/conversations/:userId', authMiddleware, socketController.getUserConversations);
router.get('/messages', authMiddleware, socketController.getConversationMessages);
router.post('/messages/:messageId/reaction', authMiddleware, socketController.toggleReaction);

// Routes pour les groupes
router.post('/create', authMiddleware,socketController.createGroup);     // Cette route crée un groupe  // Cette route ajoute un membre à un groupe
router.get('/getallGroupByUser', authMiddleware, socketController.getUserGroups); // Cette route récupère tous les groupes
router.post('/:groupId/members', authMiddleware, socketController.addMemberToGroup);
// Méthode pour récupérer un utilisateur par email
router.get('/email/:email', authMiddleware, async (req, res) => {
  try {
    const user = await socketController.getUserByEmail(req.params.email);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateurnon trouvé' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});
router.post('/add-member', authMiddleware,socketController.addMemberByEmail); // Cette route ajoute un membre à un groupe par email
module.exports = router;
