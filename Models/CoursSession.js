// Models/CoursSession.js

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ① Sous-schéma Participant enrichi
const ParticipantSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'user',       
    required: true
  },
  inscription_date: {
    type: Date,
    default: Date.now
  },
  notified: {
    type: Boolean,
    default: false
  },
  // ← champ pour stocker le hash du mot de passe de session
  sessionPasswordHash: {
    type: String,
    required: true
  },
  reminders_sent: {
    type: Number,
    default: 0
  }
});
const CoursSessionSchema = new Schema({
  title: {
    type: String,
    required: true,
    minlength: 3,
    maxlength: 100
  },
  cours_id: {
    type: Schema.Types.ObjectId,
    ref: 'Cours',
    required: true
  },
  video_url: {
    type: String,
    required: true
  },
  duration: {
    amount: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['minutes'],
      default: 'minutes'
    }
  },
  startdate: {
    type: Date,
    required: true
  },
  enddate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed', 'scheduled', 'in-progress', 'cancelled'],
    required: true
  },
  participants: [ParticipantSchema],
  
  bookings: [{
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true // Format: "HH:mm"
    },
    motif: {
      type: String
    },
    booked_at: {
      type: Date,
      default: Date.now
    }
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CoursSession', CoursSessionSchema);
