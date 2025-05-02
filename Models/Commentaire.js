const mongoose = require("mongoose");

const CommentaireSchema = new mongoose.Schema({
  idAuteur: { type: mongoose.Schema.Types.ObjectId ,ref: "User" },
  idPost: { type: mongoose.Schema.Types.ObjectId ,ref: "Post" },
  contenu: String,
  date_creation:Date,
  
});

module.exports = mongoose.model("Commentaire", CommentaireSchema);