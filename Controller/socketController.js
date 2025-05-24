const jwt = require("jsonwebtoken");
const Message = require("../Models/Message");
const Group = require("../Models/Group");
const { v4: uuidv4 } = require("uuid");

module.exports = function (io) {
  const users = new Map();
  const activeConversations = new Map();
  // Ajouter un ensemble pour suivre les messages récemment envoyés
  const recentMessages = new Set();

  const getKey = (id1, id2) => [id1, id2].sort().join("_");

  io.on("connection", async (socket) => {
    console.log("🟢 Connexion détectée :", socket.id);

    // 🔐 Récupérer le token
    const token = socket.handshake.query.token;
    if (!token) {
      console.error("❌ Aucun token fourni.");
      return socket.disconnect(true);
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "maktoubSecretKey");
      console.log("🧩 Token décodé :", decoded);
    } catch (err) {
      console.error("❌ Token invalide :", err.message);
      return socket.disconnect(true);
    }

    const expediteurId = decoded.id;
    if (!expediteurId) {
      console.error("❌ id introuvable dans le token !");
      return socket.disconnect(true);
    }

    // 🔁 Déconnecter les sockets existants pour cet utilisateur
    if (users.has(expediteurId)) {
      const oldSocketId = users.get(expediteurId);
      io.sockets.sockets.get(oldSocketId)?.disconnect(true);
      console.log(`🔌 Socket précédent déconnecté pour ${expediteurId}`);
    }
    users.set(expediteurId, socket.id);
    socket.join(expediteurId);
    console.log("✅ Utilisateur authentifié :", expediteurId);

    // Rejoindre les rooms des groupes
    try {
      const groups = await Group.find({ members: expediteurId });
      groups.forEach((group) => {
        socket.join(group._id.toString());
        console.log(`👥 Utilisateur ${expediteurId} a rejoint la room ${group._id}`);
      });
    } catch (err) {
      console.error("❌ Erreur lors de la connexion de l'utilisateur :", err.message);
    }

    // 📩 Envoi de message One-to-One
    socket.on("sendMessage", async (data) => {
      try {
        if (typeof data === "string") data = JSON.parse(data);

        if (!data.destinataireId || !data.contenu) {
          console.error("Erreur : destinataireId et contenu sont nécessaires !");
          return;
        }

        // Créer un identifiant unique pour ce message
        const messageId = `${expediteurId}_${data.destinataireId}_${data.contenu}_${Date.now()}`;
        
        // Vérifier si ce message a déjà été traité récemment
        if (recentMessages.has(messageId)) {
          console.log("Message déjà traité récemment, ignoré");
          return;
        }
        
        // Ajouter le message à l'ensemble des messages récents
        recentMessages.add(messageId);
        
        // Nettoyer l'ensemble des messages récents après 5 secondes
        setTimeout(() => {
          recentMessages.delete(messageId);
        }, 5000);

        const key = getKey(expediteurId, data.destinataireId);

        // Assurez-vous que la conversation existe, sinon créez-la
        if (!activeConversations.has(key)) {
          activeConversations.set(key, {
            conversationId: uuidv4(),
            membres: [expediteurId, data.destinataireId],
            messages: [],
          });
        }

        // Récupérez la conversation après l'avoir créée si nécessaire
        const conversation = activeConversations.get(key);

        // Création du message
        const message = new Message({
          expediteurId,
          destinataireId: data.destinataireId,
          contenu: data.contenu,
          dateEnvoi: new Date(),
          conversationId: key,
        });

        await message.save();

        // Ajoutez le message à la conversation
        conversation.messages.push(message);

        // Envoyer au destinataire s'il est connecté
        const destinataireSocketId = users.get(data.destinataireId);
        if (destinataireSocketId) {
          // Utiliser socket.to pour envoyer uniquement au destinataire
          socket.to(data.destinataireId).emit("newMessage", message);
          console.log(`Message envoyé au destinataire: ${data.destinataireId}`);
        } else {
          socket.emit("messageStatus", {
            status: "non-livré",
            message: "Destinataire non connecté, message enregistré",
          });
          console.log(`Destinataire ${data.destinataireId} non connecté, message enregistré`);
        }
        
        // Envoyer une confirmation à l'expéditeur via son socket uniquement
        socket.emit("newMessage", message);
        console.log(`Message confirmation envoyée à l'expéditeur: ${expediteurId}`);
      } catch (error) {
        console.error("Erreur lors de l'envoi du message :", error);
        socket.emit("messageStatus", { 
          status: "erreur", 
          message: "Erreur lors de l'envoi du message" 
        });
      }
    });

    // Écouter l'événement join-group
    socket.on("join-group", ({ groupId }, callback) => {
      socket.join(groupId.toString());
      console.log(`👥 Rejoint la room du groupe ${groupId}`);
      if (callback) {
        callback({ status: "success", groupId });
      }
    });

    // 📩 Envoi de message de groupe
    socket.on("send-group-message", async (data) => {
      try {
        let parsedData = typeof data === "string" ? JSON.parse(data) : data;
        if (!parsedData || !parsedData.contenu || (!parsedData.groupId && !parsedData.destinataireIds)) {
          console.error("❌ Données invalides ou manquantes");
          return;
        }

        let { groupId, destinataireIds, contenu } = parsedData;
        
        // Créer un identifiant unique pour ce message de groupe
        const messageGroupId = `${expediteurId}_group_${contenu}_${Date.now()}`;
        
        // Vérifier si ce message a déjà été traité récemment
        if (recentMessages.has(messageGroupId)) {
          console.log("Message de groupe déjà traité récemment, ignoré");
          return;
        }
        
        // Ajouter le message à l'ensemble des messages récents
        recentMessages.add(messageGroupId);
        
        // Nettoyer l'ensemble des messages récents après 5 secondes
        setTimeout(() => {
          recentMessages.delete(messageGroupId);
        }, 5000);

        let group;
        let messageDestinataireIds = destinataireIds || [];

        if (!groupId) {
          if (!messageDestinataireIds.includes(expediteurId)) {
            messageDestinataireIds.push(expediteurId);
          }
          const membres = [...new Set(messageDestinataireIds)];
          group = new Group({
            name: "Groupe temporaire",
            creator: expediteurId,
            members: membres,
            admins: [expediteurId],
          });

          await group.save();
          groupId = group._id;
          console.log("✅ Groupe créé automatiquement :", groupId);

          membres.forEach((memberId) => {
            const memberSocketId = users.get(memberId.toString());
            if (memberSocketId) {
              io.to(memberSocketId).emit("join-group", { groupId: group._id });
            }
          });

          socket.join(groupId.toString());
          io.to(groupId.toString()).emit("group-created", {
            groupId: group._id,
            name: group.name,
            members: group.members,
            creator: group.creator,
          });
        } else {
          group = await Group.findById(groupId);
          if (!group) {
            console.error("🚫 Groupe introuvable :", groupId);
            return;
          }
          if (!group.members.includes(expediteurId)) {
            console.error("🚫 L'expéditeur n'est pas membre du groupe !");
            return;
          }
          messageDestinataireIds = group.members;
        }

        // Création du message
        const newMessage = new Message({
          expediteurId,
          contenu,
          isGroupMessage: true,
          groupId,
          destinataireIds: messageDestinataireIds,
          dateEnvoi: new Date(),
        });

        await newMessage.save();
        console.log("✅ Message enregistré :", newMessage._id);

        // Diffuser à tous les membres de la room (SAUF l'expéditeur)
        socket.to(groupId.toString()).emit("new-group-message", {
          _id: newMessage._id,
          expediteurId,
          contenu,
          groupId,
          destinataireIds: messageDestinataireIds,
          dateEnvoi: newMessage.dateEnvoi,
        });
        
        // Envoyer séparément à l'expéditeur
        socket.emit("new-group-message", {
          _id: newMessage._id,
          expediteurId,
          contenu,
          groupId,
          destinataireIds: messageDestinataireIds,
          dateEnvoi: newMessage.dateEnvoi,
        });

        console.log("✅ Message de groupe envoyé à :", messageDestinataireIds);
      } catch (err) {
        console.error("❌ Erreur lors de l'envoi du message :", err.message);
      }
    });

    // 📴 Déconnexion
    socket.on("disconnect", async () => {
      console.log("🔴 Déconnexion :", socket.id);
      users.delete(expediteurId);

      for (const [key, convo] of activeConversations.entries()) {
        if (!convo.membres.includes(expediteurId)) continue;

        const [u1, u2] = convo.membres;
        const isU1Online = users.has(u1);
        const isU2Online = users.has(u2);

        if (!isU1Online && !isU2Online) {
          activeConversations.delete(key);
        }
      }
    });
  });
};