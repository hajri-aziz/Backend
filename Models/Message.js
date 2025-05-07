const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  expediteurId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  destinataireId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: function() { return !this.isGroupMessage; } 
  },
  contenu: { 
    type: String, 
    required: true 
  },
  dateEnvoi: { 
    type: Date, 
    default: Date.now 
  },
  isGroupMessage: { 
    type: Boolean, 
    default: false 
  },
  groupId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: function () {
      return this.isGroupMessage === true;}
  },
  conversationId: { 
    type: String, 
    required: function() { return !this.isGroupMessage; },
    index: true 
  },
  reactions: [{
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    emoji: { 
      type: String, 
      required: true, 
      enum: ['👍', '❤️', '😂', '😮', '😢', '😡'] 
    },
    date: { 
      type: Date, 
      default: Date.now 
    }
  }],
  status: { 
    type: String, 
    enum: ['envoyé', 'livré', 'non-livré'], 
    default: 'envoyé' 
  },
  readBy: [{ 
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }, 
    date: { 
      type: Date, 
      default: Date.now 
    } 
  }]
});

// Index pour accélérer les recherches
messageSchema.index({ conversationId: 1, dateEnvoi: 1 });
messageSchema.index({ groupId: 1, dateEnvoi: 1 });
messageSchema.index({ 'reactions.emoji': 1 });

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
