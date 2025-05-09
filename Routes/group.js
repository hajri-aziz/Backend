// Routes/group.js

const express = require("express");
const router = express.Router();
const { authMiddleware } = require('../Middll/authMiddleware');  // Vérifie que ton middleware d'authentification est correct
const socketController = require('../Controller/ForumController');  // Assure-toi que ton contrôleur est correctement importé
// Routes pour les messages
router.get('/conversations/:userId', authMiddleware, socketController.getUserConversations);
router.get('/messages', authMiddleware, socketController.getConversationMessages);
router.post('/messages/:messageId/reaction', authMiddleware, socketController.toggleReaction);

// Routes pour les groupes
router.post('/create', authMiddleware,socketController.createGroup);     // Cette route crée un groupe
router.post('/ajouterMember', authMiddleware, socketController.addMember);  // Cette route ajoute un membre à un groupe

module.exports = router;
