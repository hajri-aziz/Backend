const { ref } = require("joi");
const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  idAuteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  idCommentaire: [{ type: mongoose.Schema.Types.ObjectId , ref: "Commentaire" }],
  titre: String,
  contenu: String,
  date_creation:Date,
  image: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
});

module.exports = mongoose.model("Post", PostSchema);
