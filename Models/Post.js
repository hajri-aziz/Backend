const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  idAuteur: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  titre: { type: String, required: true },
  contenu: { type: String, required: true },
  date_creation: { type: Date, default: Date.now },
  image: String,
  likes: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    type: { 
      type: String, 
      enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
      default: 'like'
    },
    date: { type: Date, default: Date.now }
  }],
});

module.exports = mongoose.model("Post", PostSchema);
