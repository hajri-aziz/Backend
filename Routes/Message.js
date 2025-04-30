const express = require('express');
const router = express.Router();

// Importer uniquement les fonctions REST
const { getConversationMessages, getUserConversations } = require('../Controller/socketController');

// Définir les routes REST
router.get('/conversation', getConversationMessages);
router.get('/conversations/:userId', getUserConversations);
// Routes pour les réactions
router.post('/messages/:messageId/reactions', auth, reactionController.toggleReaction);
router.get('/messages/:messageId/reactions', auth, reactionController.getReactions);

module.exports = router;
