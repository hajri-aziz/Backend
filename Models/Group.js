const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  theme: {
    type: String,
    enum: ['anxiété', 'dépression', 'bien-être', 'addiction', 'autre'],
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  maxMembers: {
    type: Number,
    default: 50
  },
  rules: {
    type: String
  },
  // Ajout de la référence aux messages du groupe
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupMessage'
  }],
  // Dernier message pour faciliter l'affichage dans la liste des groupes
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupMessage'
  },
  // Statistiques du groupe
  stats: {
    messageCount: {
      type: Number,
      default: 0
    },
    activeMembers: {
      type: Number,
      default: 0
    }
  }
});

// Index pour recherche par thème
groupSchema.index({ theme: 1 });
// Index pour recherche par créateur
groupSchema.index({ creator: 1 });

module.exports = mongoose.models.Group || mongoose.model('Group', groupSchema);