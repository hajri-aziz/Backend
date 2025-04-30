const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  idAuteur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  idPost: { type: mongoose.Schema.Types.ObjectId },
  idCommentaire: [{ type: mongoose.Schema.Types.ObjectId }],
  titre: String,
  contenu: String,
  date_creation:Date,
  image: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
});

module.exports = mongoose.model("Post", PostSchema);
