const jwt = require("jsonwebtoken");
const Message = require("../Models/Message");
const Group = require("../Models/Group");
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

// 👇 Corriger ici
const expediteurId = decoded.id; // ou autre champ selon le contenu réel
if (!expediteurId) {
  console.error("❌ id introuvable dans le token !");
  return socket.disconnect(true);
}
  // 🔁 Stocker l'utilisateur connecté
  users.set(expediteurId, socket.id);
  socket.join(expediteurId); // Optionnel : pour les rooms privées

  console.log("✅ Utilisateur authentifié :", expediteurId);

  // Événement de déconnexion
  socket.on('disconnect', () => {
    users.delete(expediteurId); // Supprimer l'utilisateur de la liste des connectés
    socket.leave(expediteurId); // Quitter la room privée
    console.log("🔴 Utilisateur déconnecté :", expediteurId);
  });
    // 📩 Envoi de message One-to-One
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

    // 📢 Envoi de message de groupe
    socket.on("send-group-message", async ({ groupId, contenu }) => {
      try {
        const group = await Group.findById(groupId);
        if (!group || !group.members.includes(expediteurId)) return;

        const newMessage = new Message({
          expediteurId,
          contenu,
          isGroupMessage: true,
          groupId,
        });

        await newMessage.save();

        await Group.findByIdAndUpdate(groupId, { lastMessage: contenu });

        io.to(groupId).emit("new-group-message", {
          _id: newMessage._id,
          expediteurId,
          contenu,
          groupId,
          dateEnvoi: newMessage.dateEnvoi,
        });
      } catch (err) {
        console.error("❌ Erreur message groupe :", err);
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
