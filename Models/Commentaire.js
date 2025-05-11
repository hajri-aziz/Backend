const mongoose = require("mongoose");

const CommentaireSchema = new mongoose.Schema({
  idAuteur: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  idPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  contenu: { type: String, required: true },
  date_creation: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Commentaire", CommentaireSchema);
