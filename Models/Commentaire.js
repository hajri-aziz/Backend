const mongoose = require("mongoose");

const CommentaireSchema = new mongoose.Schema({
  idAuteur: { type: mongoose.Schema.Types.ObjectId },
  idPost: { type: mongoose.Schema.Types.ObjectId },
  contenu: String,
  date_creation:Date,
  
});

module.exports = mongoose.model("Commentaire", CommentaireSchema);