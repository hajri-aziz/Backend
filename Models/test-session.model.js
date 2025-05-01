const mongoose = require('mongoose');

const testSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned', 'expired'],
    default: 'in_progress'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  duration: {
    type: Number, // in seconds
    default: 0
  },
  responses: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    answer: mongoose.Schema.Types.Mixed,
    timeSpent: Number, // in seconds
    answeredAt: {
      type: Date,
      default: Date.now
    },
    isCorrect: Boolean,
    score: Number,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  }],
  scoring: {
    rawScore: {
      type: Number,
      default: 0
    },
    normalizedScore: {
      type: Number,
      min: 0,
      max: 100
    },
    percentile: Number,
    breakdown: [{
      trait: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PersonalityTrait'
      },
      score: Number,
      confidence: Number
    }]
  },
  metadata: {
    device: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      required: true
    },
    browser: String,
    ipAddress: String,
    location: {
      country: String,
      city: String,
      timezone: String
    },
    version: {
      type: Number,
      default: 1
    }
  },
  flags: {
    hasTimeLimit: {
      type: Boolean,
      default: false
    },
    timeLimit: Number, // in minutes
    allowPause: {
      type: Boolean,
      default: true
    },
    showResults: {
      type: Boolean,
      default: true
    },
    requiresProctoring: {
      type: Boolean,
      default: false
    }
  },
  analytics: {
    questionSkips: {
      type: Number,
      default: 0
    },
    answerChanges: {
      type: Number,
      default: 0
    },
    pauseCount: {
      type: Number,
      default: 0
    },
    totalPauseDuration: {
      type: Number,
      default: 0
    }
  },
  validationStatus: {
    isValid: {
      type: Boolean,
      default: true
    },
    invalidationReason: String,
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    validatedAt: Date
  }
}, {
  timestamps: true,
  indexes: [
    { user: 1, test: 1 },
    { status: 1 },
    { startTime: 1 }
  ]
});

// Methods with suppressWarning
testSessionSchema.methods.validateSession = function() {
  // Basic validation rules
  const isValid = 
    this.responses.length > 0 &&
    !this.isExpired() &&
    this.status === 'completed';
  
  return {
    isValid,
    reason: !isValid ? 'Session validation failed' : null
  };
}.bind(testSessionSchema.methods, { suppressWarning: true });

// Other methods without validate in the name don't need suppressWarning
testSessionSchema.methods.calculateDuration = function() {
  if (this.endTime && this.startTime) {
    return Math.round((this.endTime - this.startTime) / 1000); // in seconds
  }
  return 0;
};

testSessionSchema.methods.isExpired = function() {
  if (!this.flags.hasTimeLimit || !this.startTime) return false;
  const timeLimit = this.flags.timeLimit * 60 * 1000; // convert to milliseconds
  return Date.now() - this.startTime > timeLimit;
};

// Middleware
testSessionSchema.pre('save', function(next) {
  if (this.isModified('responses')) {
    // Update scoring
    const totalQuestions = this.responses.length;
    const answeredQuestions = this.responses.filter(r => r.answer != null).length;
    const correctAnswers = this.responses.filter(r => r.isCorrect).length;
    
    this.scoring.rawScore = correctAnswers;
    this.scoring.normalizedScore = (correctAnswers / totalQuestions) * 100;
    
    // Update analytics
    this.analytics.questionSkips = totalQuestions - answeredQuestions;
  }
  
  if (this.isModified('status') && this.status === 'completed') {
    this.endTime = new Date();
    this.duration = this.calculateDuration();
  }
  
  next();
});

const TestSession = mongoose.model('TestSession', testSessionSchema);

module.exports = TestSession;