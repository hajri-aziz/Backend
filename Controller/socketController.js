// Import du modèle de message depuis les modèles Mongoose
const Message = require("../models/Message");
const Group = require("../models/Group");

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
socket.on("send-group-message", async ({ groupId, expediteurId, contenu }) => {
  try {
    // Vérifie si le groupe existe
    const group = await Group.findById(groupId);
    if (!group || !group.members.includes(expediteurId)) return;

    // Crée le message
    const newMessage = new Message({
      expediteurId,
      contenu,
      isGroupMessage: true,
      groupId
    });

    await newMessage.save();

    // Met à jour le dernier message dans le groupe
    await Group.findByIdAndUpdate(groupId, {
      lastMessage: contenu
    });

    // Envoie le message à tous les membres du groupe
    io.to(groupId).emit("new-group-message", {
      _id: newMessage._id,
      expediteurId,
      contenu,
      groupId,
      dateEnvoi: newMessage.dateEnvoi
    });

  } catch (err) {
    console.error("Erreur lors de l'envoi du message de groupe :", err);
  }
});




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
    }); }