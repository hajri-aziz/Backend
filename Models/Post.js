const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  idAuteur: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  titre: { type: String, required: true },
  contenu: { type: String, required: true },
  date_creation: { type: Date, default: Date.now },
  image: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]
});

module.exports = mongoose.model("Post", PostSchema);
