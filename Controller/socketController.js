// Import du modèle de message depuis les modèles Mongoose
const Message = require("../Models/Message");
const Group = require("../Models/Group");

// Import de la fonction uuidv4 pour générer des IDs uniques
const { v4: uuidv4 } = require("uuid");
const { get } = require("mongoose");

//*************************************************SOCKET******************************************** */

module.exports = function(io) {

    // Map pour stocker les utilisateurs connectés : clé = expediteurId, valeur = socket.id
    const users = new Map();
    const groupUsers = new Map();

    // Map pour suivre les conversations actives entre utilisateurs
    // Clé = combinaison unique des deux utilisateurs (triés), valeur = objet contenant les messages et ID de conversation
    const activeConversations = new Map();

    // Fonction utilitaire pour générer une clé unique pour une paire d'utilisateurs
    const getKey = (id1, id2) => [id1, id2].sort().join("_");

// Lorsqu'un client se connecte au serveur
    io.on("connection", (socket) => {
        console.log("🟢 Un utilisateur s'est connecté :", socket.id);

        // Récupérer l'expediteurId depuis les paramètres de la connexion
        const expediteurId = socket.handshake.query.expediteurId;
        if (!expediteurId) {
            console.error("❌ Expéditeur ID manquant !");
            return;
        }

        // Enregistrer l'utilisateur connecté dans la map
        users.set(expediteurId, socket.id);
        console.log("ID de l'expéditeur :", expediteurId);

        // Gestion de l'envoi de message One-to-One
        socket.on("sendMessage", async (data) => {
            try {
                if (typeof data === "string") data = JSON.parse(data);
        
                // Vérifier que les données nécessaires sont présentes
                if (!data.destinataireId || !data.contenu) {
                    console.error("Erreur : destinataireId et contenu sont nécessaires !");
                    return;
                }
        
                const key = getKey(expediteurId, data.destinataireId);
        
                // Créer une nouvelle conversation si elle n'existe pas
                if (!activeConversations.has(key)) {
                    activeConversations.set(key, {
                        conversationId: uuidv4(), // ID unique de conversation
                        membres: [expediteurId, data.destinataireId],
                        messages: []
                    });
                }
        
                // Création du message
                const message = {
                    expediteurId,
                    destinataireId: data.destinataireId,
                    contenu: data.contenu,
                    dateEnvoi: new Date(),
                    reactions: Array.isArray(data.reactions) ? data.reactions : [],
                    isGroupMessage: false,
                    status: 'livré'
                };
        
                // Ajout du message à la conversation en mémoire
                activeConversations.get(key).messages.push(message);
        
                // Envoi en temps réel au destinataire s’il est connecté
                const destinataireSocketId = users.get(data.destinataireId);
                if (destinataireSocketId) {
                    io.to(destinataireSocketId).emit("newMessage", message);
                    console.log("Message envoyé à :", data.destinataireId);
                } else {
                    // Sinon, notifier l'expéditeur que le message est non livré mais enregistré
                    socket.emit("messageStatus", {
                        status: "non-livré",
                        message: "Destinataire non connecté, message enregistré"
                    });
                }
            } catch (error) {
                console.error("Erreur lors de l'envoi du message :", error);
            }
        });
        

        // Gestion de l'envoi de message One-to-Many (à plusieurs destinataires)
        socket.on("sendMessageToMany", async (data) => {
            try {
                if (typeof data === "string") data = JSON.parse(data);

                // Vérification que tous les champs nécessaires sont présents
                if (!data.destinatairesIds || !Array.isArray(data.destinatairesIds) || !data.contenu) {
                    console.error("Erreur : destinatairesIds (array) et contenu sont nécessaires !");
                    return;
                }

                // Parcourir tous les destinataires
                for (const destinataireId of data.destinatairesIds) {
                    const key = getKey(expediteurId, destinataireId);

                    // Créer une nouvelle conversation si elle n'existe pas
                    if (!activeConversations.has(key)) { 
                        //activateConversations: est une map ,Stocker en mémoire les conversations en cours entre utilisateurs connectés.
                        activeConversations.set(key, {
                            conversationId: uuidv4(),
                            membres: [expediteurId, destinataireId],
                            messages: []
                        });
                    }

                    // Création du message
                    const message = {
                        expediteurId,
                        destinataireId,
                        contenu: data.contenu,
                        dateEnvoi: new Date(),
                        reactions: [emoji, userId], // Initialiser les réactions
                        isGroupMessage: true,
                        status: 'livré'
                    };

                    // Ajout du message à la conversation
                    activeConversations.get(key).messages.push(message);

                    // Envoi du message au destinataire s’il est connecté
                    const destinataireSocketId = users.get(destinataireId);
                    if (destinataireSocketId) {
                        io.to(destinataireSocketId).emit("newMessage", message);
                        console.log("Message envoyé à :", destinataireId);
                    } else {
                        // Sinon, notifier l'expéditeur pour ce destinataire
                        socket.emit("messageStatus", {
                            destinataireId,
                            status: "non-livré",
                            message: "Destinataire non connecté, message enregistré"
                        });
                    }
                }
            } catch (error) {
                console.error("Erreur lors de l'envoi du message one-to-many :", error);
            }
        });

        //*********************************REACTIONS ******************** */

         // Écouter les réactions
// Remplacer l'événement 'toggleReaction' par 'reaction' pour être cohérent
// Dans votre contrôleur Socket.IO
socket.on('reaction', async (data) => {
    try {
        console.log('📌 Réaction reçue:', data); // Debug
        
        // Validation des données
        if (!data.messageId || !data.emoji || !data.userId) {
            throw new Error('Données manquantes');
        }

        if (!mongoose.Types.ObjectId.isValid(data.messageId)) {
            throw new Error('ID de message invalide');
        }

        // Trouver le message
        const message = await Message.findById(data.messageId);
        if (!message) {
            throw new Error('Message non trouvé');
        }

        // Vérifier les permissions (exemple simplifié)
        const canReact = message.expediteurId === data.userId || 
                        message.destinataireId === data.userId ||
                        (message.isGroupMessage && await Group.exists({ 
                            _id: message.groupId, 
                            membres: data.userId 
                        }));

        if (!canReact) {
            throw new Error('Permission refusée');
        }

        // Gestion des réactions (toggle)
        const reactionIndex = message.reactions.findIndex(
            r => r.userId.equals(data.userId) && r.emoji === data.emoji
        );

        if (reactionIndex !== -1) {
            message.reactions.splice(reactionIndex, 1); // Retirer la réaction
        } else {
            message.reactions.push({ // Ajouter la réaction
                userId: data.userId,
                emoji: data.emoji
            });
        }

        await message.save();

        // Diffuser la mise à jour
        const room = message.isGroupMessage ? 
            `group_${message.groupId}` : 
            `conv_${[message.expediteurId, message.destinataireId].sort().join('_')}`;

        io.to(room).emit('reaction_updated', {
            messageId: message._id,
            reactions: message.reactions
        });

        console.log('✅ Réaction traitée - Room:', room); // Debug

    } catch (error) {
        console.error('❌ Erreur:', error.message);
        socket.emit('reaction_error', {
            message: error.message
        });
    }
});
socket.on('toggleReaction', async (data) => {
    try {
        console.log('Données reçues:', data);
        
        // Validation des données
        if (!data.messageId || !data.emoji || !data.userId) {
            throw new Error('Données manquantes');
        }

        if (!mongoose.Types.ObjectId.isValid(data.messageId)) {
            throw new Error('ID de message invalide');
        }

        // Trouver le message
        const message = await Message.findById(data.messageId);
        if (!message) {
            throw new Error('Message non trouvé');
        }

        // Vérifier si l'utilisateur peut réagir
        const canReact = message.expediteurId === data.userId || 
                        message.destinataireId === data.userId ||
                        (message.isGroupMessage && await Group.exists({
                            _id: message.groupId,
                            membres: data.userId
                        }));

        if (!canReact) {
            throw new Error('Permission refusée');
        }

        // Gestion des réactions (toggle)
        const reactionIndex = message.reactions.findIndex(
            r => r.userId.equals(data.userId) && r.emoji === data.emoji
        );

        if (reactionIndex !== -1) {
            // Retirer la réaction existante
            message.reactions.splice(reactionIndex, 1);
            console.log('Réaction retirée');
        } else {
            // Ajouter nouvelle réaction (en supprimant d'abord les autres réactions du user)
            message.reactions = message.reactions.filter(r => !r.userId.equals(data.userId));
            message.reactions.push({
                userId: data.userId,
                emoji: data.emoji,
                date: new Date()
            });
            console.log('Nouvelle réaction ajoutée');
        }

        // Sauvegarder
        const updatedMessage = await message.save();
        console.log('Message sauvegardé:', updatedMessage);

        // Diffuser la mise à jour
        const room = message.isGroupMessage ? 
            `group_${message.groupId}` : 
            `conv_${[message.expediteurId, message.destinataireId].sort().join('_')}`;

        io.to(room).emit('reactionUpdated', {
            messageId: message._id,
            reactions: message.reactions
        });

    } catch (error) {
        console.error('Erreur:', error.message);
        socket.emit('reactionError', { error: error.message });
    }
});
//*********************************SOCKET GROUP****************** */
// Gestion des groupes avec Socket.IO
socket.on("joinGroup", (groupId) => {
    // Ajouter l'utilisateur à ce groupe
    if (!groupUsers.has(groupId)) {
      groupUsers.set(groupId, new Set());
    }
    groupUsers.get(groupId).add(expediteurId);
    
    // Abonner l'utilisateur au canal du groupe
    socket.join(`group:${groupId}`);
    console.log(`Utilisateur ${expediteurId} a rejoint le groupe ${groupId}`);
  });
  
socket.on("leaveGroup", (groupId) => {
    // Retirer l'utilisateur du groupe
    if (groupUsers.has(groupId)) {
      groupUsers.get(groupId).delete(expediteurId);
    }
    socket.leave(`group:${groupId}`);
    console.log(`Utilisateur ${expediteurId} a quitté le groupe ${groupId}`);
  });
  
socket.on("sendGroupMessage", async (data) => {
    try {
      if (typeof data === "string") data = JSON.parse(data);
      
      // Vérifier que les données nécessaires sont présentes
      if (!data.groupId || !data.contenu) {
        console.error("Erreur : groupId et contenu sont nécessaires pour un message de groupe !");
        return;
      }
      
      // Créer le message
      const message = {
        expediteurId,
        isGroupMessage: true,
        groupId: data.groupId,
        contenu: data.contenu,
        dateEnvoi: new Date(),
        status: 'livré'
      };
      
      // Sauvegarder directement dans la base de données pour les messages de groupe
      // pour avoir une persistance immédiate
      const newMessage = await Message.create(message);
      
      // Envoyer le message à tous les membres du groupe
      io.to(`group:${data.groupId}`).emit("newGroupMessage", {
        ...message,
        _id: newMessage._id  // Inclure l'ID généré par MongoDB
      });
      
      console.log(`Message envoyé au groupe ${data.groupId}`);
    } catch (error) {
      console.error("Erreur lors de l'envoi du message de groupe :", error);
    }
  });

        // Lorsqu’un utilisateur se déconnecte
socket.on("disconnect", async () => {
            console.log("🔴 Un utilisateur s'est déconnecté :", socket.id);

            let disconnectedUserId;

            // Trouver quel utilisateur est déconnecté en recherchant dans la map
            for (let [key, value] of users.entries()) {
                if (value === socket.id) {
                    disconnectedUserId = key;
                    users.delete(key); // Le retirer de la liste des connectés
                    console.log(`🗑️ Utilisateur ${key} supprimé de la liste des connectés.`);
                    break;
                }
            }

            if (!disconnectedUserId) {
                console.log("⚠️ Aucun utilisateur déconnecté trouvé");
                return;
            }

            // Vérifier les conversations où cet utilisateur était impliqué
            for (const [key, convo] of activeConversations.entries()) {
                if (!convo.membres.includes(disconnectedUserId)) continue;

                const [u1, u2] = convo.membres;
                const isU1Online = users.has(u1);
                const isU2Online = users.has(u2);

                console.log(`🧪 Vérification : ${u1} est ${isU1Online ? 'en ligne' : 'hors ligne'}, ${u2} est ${isU2Online ? 'en ligne' : 'hors ligne'}`);

                // Si aucun des deux membres n'est connecté, on sauvegarde la conversation
                if (!isU1Online && !isU2Online) {
                    const cleanedMessages = convo.messages.map(msg => ({
                        expediteurId: msg.expediteurId,
                        destinataireId: msg.destinataireId,
                        contenu: msg.contenu,
                        dateEnvoi: msg.dateEnvoi
                    }));

                    try {
                        await Message.create({
                            expediteurId: cleanedMessages[0].expediteurId,
                            destinataireId: cleanedMessages[0].destinataireId,
                            contenu: JSON.stringify(cleanedMessages),
                            conversationId: convo.conversationId,
                            status: 'livré',
                            dateEnvoi: new Date()
                        });
                        console.log(`✅ Conversation ${key} sauvegardée avec messages simplifiés`);
                    } catch (err) {
                        console.error("❌ Erreur lors de la sauvegarde :", err);
                    }

                    // Supprimer la conversation de la mémoire
                    activeConversations.delete(key);
                }
            }
        });
    });
//*******************************************methode APIREST******************************************** */
    // Contrôleur pour récupérer les messages d'une conversation spécifique
async function getConversationMessages(req, res) {
        try {
            const { userId, otherUserId } = req.query;
            if (!userId || !otherUserId) {
                return res.status(400).send("Les IDs des deux utilisateurs sont nécessaires !");
            }

            const conversationId = getKey(userId, otherUserId);
            const messages = await Message.find({ conversationId }).sort({ dateEnvoi: 1 });

            if (messages.length > 0) {
                const fullConversation = JSON.parse(messages[0].contenu);
                return res.status(200).json(fullConversation);
            }

            res.status(200).json([]);
        } catch (err) {
            console.error("Erreur lors de la récupération des messages :", err);
            res.status(500).send("Erreur serveur");
        }
    }

    // Contrôleur pour récupérer toutes les conversations d’un utilisateur
async function getUserConversations(req, res) {
        try {
            const { userId } = req.params;
            if (!userId) {
                return res.status(400).send("L'ID de l'utilisateur est nécessaire !");
            }

            const conversations = await Message.find({
                $or: [
                    { expediteurId: userId },
                    { destinataireId: userId }
                ]
            }).sort({ dateEnvoi: -1 });

            res.status(200).json(conversations);
        } catch (err) {
            console.error("Erreur lors de la récupération des conversations :", err);
            res.status(500).send("Erreur serveur");
        }
    }
//******************************Reactions Message****************************************** */

// Remplacer la fonction addReaction existante par celle-ci
async function addReaction(req, res) {
    try {
        const { messageId } = req.params;
        const { emoji, userId } = req.body; // userId provient du body pour le test, normalement du token

        // Vérifier si le messageId est valide
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({ message: "ID de message invalide" });
        }
        
        // Trouver le message
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message non trouvé" });
        }
        
        // Vérifier si l'utilisateur a déjà réagi avec cet emoji
        const existingReactionIndex = message.reactions.findIndex(
            reaction => reaction.userId.toString() === userId.toString() && reaction.emoji === emoji
        );
        
        if (existingReactionIndex !== -1) {
            // Supprimer la réaction si elle existe déjà (toggle)
            message.reactions.splice(existingReactionIndex, 1);
        } else {
            // Ajouter la nouvelle réaction
            message.reactions.push({
                userId,
                emoji
            });
        }
        
        // Sauvegarder les modifications
        await message.save();
        
        // Si WebSocket est disponible, émettre une mise à jour
        if (req.app.io) {
            const room = message.isGroupMessage ? message.groupId.toString() : message.conversationId;
            req.app.io.to(room).emit('reactionUpdated', {
                messageId: message._id,
                reactions: message.reactions
            });
        }
        
        return res.status(200).json({
            message: "Réaction mise à jour avec succès",
            reactions: message.reactions
        });
    } catch (error) {
        console.error("Erreur lors de la gestion de la réaction:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
}
// Ajouter ou supprimer une réaction
exports.toggleReaction = async (req, res) => {
    try {
      const { messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.user._id; // Supposons que l'ID utilisateur est disponible via middleware d'authentification
      
      // Vérifier si le messageId est valide
      if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return res.status(400).json({ message: "ID de message invalide" });
      }
      
      // Trouver le message
      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({ message: "Message non trouvé" });
      }
      
      // Vérifier si l'utilisateur a déjà réagi avec cet emoji
      const existingReactionIndex = message.reactions.findIndex(
        reaction => reaction.userId.toString() === userId.toString() && reaction.emoji === emoji
      );
      
      if (existingReactionIndex !== -1) {
        // Supprimer la réaction si elle existe déjà (toggle off)
        message.reactions.splice(existingReactionIndex, 1);
      } else {
        // Ajouter la nouvelle réaction
        message.reactions.push({
          userId,
          emoji
        });
      }
      
      // Sauvegarder les modifications
      await message.save();
      
      return res.status(200).json({
        message: "Réaction mise à jour avec succès",
        reactions: message.reactions
      });
    } catch (error) {
      console.error("Erreur lors de la gestion de la réaction:", error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  };
  
  // Récupérer toutes les réactions d'un message
exports.getReactions = async (req, res) => {
    try {
      const { messageId } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(messageId)) {
        return res.status(400).json({ message: "ID de message invalide" });
      }
      
      const message = await Message.findById(messageId)
        .populate('reactions.userId', 'nom prenom photo'); // Ajustez les champs selon votre modèle User
      
      if (!message) {
        return res.status(404).json({ message: "Message non trouvé" });
      }
      
      res.status(200).json({
        messageId,
        reactions: message.reactions
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des réactions:", error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
   };
async function getReactions(req, res) {
    try {
        const { messageId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({ message: "ID de message invalide" });
        }
        
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message non trouvé" });
        }
        
        res.status(200).json({
            messageId,
            reactions: message.reactions
        });
    } catch (error) {
        console.error("Erreur lors de la récupération des réactions:", error);
        res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
}
    return { 
        //fct message 
        getConversationMessages,
        getUserConversations,
        addReaction,
        getReactions

    };
};
