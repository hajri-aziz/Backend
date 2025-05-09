const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Group = require("../models/Group");
const { v4: uuidv4 } = require("uuid");

module.exports = function (io) {
  const users = new Map();
  const activeConversations = new Map();

  const getKey = (id1, id2) => [id1, id2].sort().join("_");

  io.on("connection", async (socket) => {
    console.log("🟢 Connexion détectée :", socket.id);

    // 🔐 Récupérer le token depuis les headers ou les params (auth)
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

    const expediteurId = decoded.id; // ou autre champ selon le contenu réel
    if (!expediteurId) {
      console.error("❌ id introuvable dans le token !");
      return socket.disconnect(true);
    }

    // 🔁 Stocker l'utilisateur connecté
    users.set(expediteurId, socket.id);
    socket.join(expediteurId); // Optionnel : pour les rooms privées
    console.log("✅ Utilisateur authentifié :", expediteurId);

    // Rejoindre les rooms des groupes de l'utilisateur
    try {
      const groups = await Group.find({ members: expediteurId });
      groups.forEach((group) => {
        socket.join(group._id.toString());
        console.log(`👥 Utilisateur ${expediteurId} a rejoint la room du groupe ${group._id}`);
      });
    } catch (err) {
      console.error('❌ Erreur lors de la connexion de l\'utilisateur :', err.message);
    }

    // 📩 Envoi de message One-to-One (version originale)
  socket.on("sendMessage", async (data) => {
      try {
        if (typeof data === "string") data = JSON.parse(data);
        if (!data.destinataireId || !data.contenu) {
          console.error("Erreur : destinataireId et contenu requis !");
          return;
        }

        const key = getKey(expediteurId, data.destinataireId);
        if (!activeConversations.has(key)) {
          activeConversations.set(key, {
            conversationId: uuidv4(),
            membres: [expediteurId, data.destinataireId],
            messages: [],
          });
        }

        const message = {
          expediteurId,
          destinataireId: data.destinataireId,
          contenu: data.contenu,
          dateEnvoi: new Date(),
          reactions: Array.isArray(data.reactions) ? data.reactions : [],
          isGroupMessage: false,
          status: "livré",
        };

        activeConversations.get(key).messages.push(message);

        const destinataireSocketId = users.get(data.destinataireId);
        if (destinataireSocketId) {
          io.to(destinataireSocketId).emit("newMessage", message);
          console.log("💬 Message livré à :", data.destinataireId);
        } else {
          socket.emit("messageStatus", {
            status: "non-livré",
            message: "Destinataire non connecté, message enregistré",
          });
        }
      } catch (err) {
        console.error("❌ Erreur d'envoi de message :", err);
      }
    });

    // Écouter l'événement join-group
    socket.on('join-group', ({ groupId }, callback) => {
      socket.join(groupId.toString());
      console.log(`👥 Rejoint la room du groupe ${groupId}`);
      if (callback) {
        callback({ status: 'success', groupId }); // Confirmation
      }
    });

    socket.on("send-group-message", async (data) => {
      console.log("📩 Reçu événement send-group-message");
      console.log("📦 Données reçues :", data);
      console.log("🔍 Type de données :", typeof data);
      console.log("🔍 Contenu brut :", JSON.stringify(data, null, 2));

      let parsedData = data;
      if (!data) {
        console.error("❌ Données manquantes");
        return;
      }

      if (typeof data === "string") {
        try {
          parsedData = JSON.parse(data);
          console.log("✅ Données parsées depuis une chaîne JSON :", parsedData);
        } catch (err) {
          console.error("❌ JSON invalide :", err.message);
          return;
        }
      }

      if (typeof parsedData !== "object" || parsedData === null) {
        console.error("❌ Format de données invalide");
        return;
      }

      let { groupId, destinataireIds, contenu } = parsedData;

      const token = socket.handshake.query.token;
      let decoded;
      try {
        if (!token) {
          console.error("❌ Aucun token");
          return;
        }
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        console.error("❌ Erreur token :", err.message);
        return;
      }

      const expediteurId = decoded.id;
      console.log("👤 ID expéditeur :", expediteurId);

      if (!contenu) {
        console.error("❌ Contenu manquant");
        return;
      }

      if (!groupId && (!destinataireIds || !Array.isArray(destinataireIds) || destinataireIds.length === 0)) {
        console.error("❌ groupId ou destinataireIds requis");
        return;
      }

      try {
        let group;
        let messageDestinataireIds = destinataireIds || [];

        if (!groupId) {
          // Création d’un groupe temporaire
          if (!messageDestinataireIds.includes(expediteurId)) {
            messageDestinataireIds.push(expediteurId);
          }
          const membres = [...new Set(messageDestinataireIds)];
          group = new Group({
            name: "Groupe temporaire",
            creator: expediteurId,
            members: membres,
            admins: [expediteurId]
          });

          await group.save();
          groupId = group._id;
          console.log("✅ Groupe créé automatiquement :", groupId);

          // Inviter les membres à rejoindre la room via join-group
          membres.forEach((memberId) => {
            const memberSocketId = users.get(memberId.toString());
            if (memberSocketId) {
              io.to(memberSocketId).emit("join-group", { groupId: group._id }, (ack) => {
                if (ack && ack.status === 'success') {
                  console.log(`✅ Utilisateur ${memberId} a rejoint la room ${groupId}`);
                } else {
                  console.log(`❌ Utilisateur ${memberId} n'a pas confirmé l'adhésion à la room ${groupId}`);
                }
              });
              console.log(`📩 Invité ${memberId} à rejoindre la room ${groupId}`);
            } else {
              console.log(`⚠️ Utilisateur ${memberId} non connecté`);
            }
          });

          // L'émetteur rejoint la room
          socket.join(groupId.toString());
          console.log(`👥 Émetteur ${expediteurId} a rejoint la room ${groupId}`);

          // Notifier les membres de la création du groupe
          io.to(groupId.toString()).emit("group-created", {
            groupId: group._id,
            name: group.name,
            members: group.members,
            creator: group.creator
          });
        } else {
          // Groupe existant
          group = await Group.findById(groupId);
          if (!group) {
            console.error("🚫 Groupe introuvable :", groupId);
            return;
          }

          if (!group.members.includes(expediteurId)) {
            console.error("🚫 L’expéditeur n’est pas membre du groupe !");
            return;
          }

          if (!destinataireIds || destinataireIds.length === 0) {
            messageDestinataireIds = group.members;
          }

          // Inviter tous les membres à rejoindre la room via join-group
          group.members.forEach((memberId) => {
            const memberSocketId = users.get(memberId.toString());
            if (memberSocketId) {
              io.to(memberSocketId).emit("join-group", { groupId }, (ack) => {
                if (ack && ack.status === 'success') {
                  console.log(`✅ Utilisateur ${memberId} a rejoint la room ${groupId}`);
                } else {
                  console.log(`❌ Utilisateur ${memberId} n'a pas confirmé l'adhésion à la room ${groupId}`);
                }
              });
              console.log(`📩 Invité ${memberId} à rejoindre la room ${groupId}`);
            } else {
              console.log(`⚠️ Utilisateur ${memberId} non connecté`);
            }
          });
        }

        // Création du message
        const newMessage = new Message({
          expediteurId,
          contenu,
          isGroupMessage: true,
          groupId,
          destinataireIds: messageDestinataireIds
        });

        await newMessage.save();
        console.log("✅ Message enregistré :", newMessage._id);

       

        // Diffuser à tous les membres de la room
        io.to(groupId.toString()).emit("new-group-message", {
          _id: newMessage._id,
          expediteurId,
          contenu,
          groupId,
          destinataireIds: messageDestinataireIds,
          dateEnvoi: newMessage.dateEnvoi
        });

        // Log pour vérifier les clients dans la room
        console.log('🔍 Clients dans la room', groupId, ':', io.sockets.adapter.rooms.get(groupId.toString()));
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
          const cleanedMessages = convo.messages.map((msg) => ({
            expediteurId: msg.expediteurId,
            destinataireId: msg.destinataireId,
            contenu: msg.contenu,
            dateEnvoi: msg.dateEnvoi,
          }));

          try {
            await Message.create({
              expediteurId: cleanedMessages[0].expediteurId,
              destinataireId: cleanedMessages[0].destinataireId,
              contenu: JSON.stringify(cleanedMessages),
              conversationId: convo.conversationId,
              status: "livré",
              dateEnvoi: new Date(),
            });
            console.log(`💾 Conversation ${key} sauvegardée.`);
          } catch (err) {
            console.error("❌ Erreur sauvegarde :", err);
          }

          activeConversations.delete(key);
        }
      }
    });
  });
};