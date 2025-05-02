const mongoose = require('mongoose');

const psychologicalProfileSchema = new mongoose.Schema({
  anonymousId: {
    type: String,
    required: [true, 'Anonymous identifier is required'],
    unique: true,
    index: true
  },
  traitScores: [{
    trait: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PersonalityTrait',
      required: true
    },
    score: {
      type: Number,
      required: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 1
    },
    assessedAt: {
      type: Date,
      default: Date.now
    }
  }],
  assessmentHistory: [{
    testSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestSession'
    },
    completedAt: {
      type: Date,
      default: Date.now
    },
    score: Number,
    duration: Number
  }],
  metadata: {
    status: {
      type: String,
      enum: ['draft', 'complete', 'archived'],
      default: 'draft'
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    version: {
      type: Number,
      default: 1
    },
    lastAssessment: {
      type: Date
    }
  },
  consent: {
    dataUsage: {
      type: Boolean,
      required: [true, 'Data usage consent is required']
    },
    research: {
      type: Boolean,
      default: false
    },
    consentedAt: {
      type: Date,
      default: Date.now
    }
  },
  privacySettings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    accessToken: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  recommendations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestRecommendation'
  }],
  notes: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isPrivate: {
      type: Boolean,
      default: true
    }
  }]
}, {
  timestamps: true
});

// Indexes
psychologicalProfileSchema.index({ anonymousId: 1 });
psychologicalProfileSchema.index({ 'traitScores.trait': 1 });
psychologicalProfileSchema.index({ 'metadata.status': 1 });

// Methods
psychologicalProfileSchema.methods.calculateCompletionPercentage = function() {
  const totalTraits = this.traitScores.length;
  const scoredTraits = this.traitScores.filter(ts => ts.score != null).length;
  return (scoredTraits / totalTraits) * 100;
};

// Middleware
psychologicalProfileSchema.pre('save', function(next) {
  if (this.isModified('traitScores')) {
    this.metadata.version += 1;
    
    const totalTraits = this.traitScores.length;
    const validScores = this.traitScores.filter(score => 
      score.score !== null && score.score !== undefined
    ).length;
    
    this.metadata.completionPercentage = (validScores / totalTraits) * 100;
    
    this.metadata.lastAssessment = new Date();
  }
  next();
});

// Method to add or update trait score
psychologicalProfileSchema.methods.updateTraitScore = async function(traitId, score, confidence = 1) {
  const existingScore = this.traitScores.find(ts => ts.trait.equals(traitId));
  
  if (existingScore) {
    existingScore.score = score;
    existingScore.confidence = confidence;
    existingScore.assessedAt = new Date();
  } else {
    this.traitScores.push({
      trait: traitId,
      score,
      confidence,
      assessedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to add assessment to history
psychologicalProfileSchema.methods.addAssessment = async function(testSessionId, score, duration) {
  this.assessmentHistory.push({
    testSession: testSessionId,
    score,
    duration,
    completedAt: new Date()
  });
  return this.save();
};

// Static method to find profiles by completion status
psychologicalProfileSchema.statics.findByCompletion = function(minCompletion = 0) {
  return this.find({
    'metadata.completionPercentage': { $gte: minCompletion },
    'metadata.status': { $ne: 'archived' }
  });
};

const PsychologicalProfile = mongoose.model('PsychologicalProfile', psychologicalProfileSchema);

module.exports = PsychologicalProfile; 