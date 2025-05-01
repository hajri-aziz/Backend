const mongoose = require('mongoose');

const testRecommendationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  baseTest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  recommendedTests: [{
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true
    },
    priority: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    relevanceScore: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    reason: {
      type: String,
      required: true
    }
  }],
  criteria: {
    baseScore: {
      min: Number,
      max: Number
    },
    traits: [{
      trait: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PersonalityTrait'
      },
      threshold: {
        min: Number,
        max: Number
      },
      weight: {
        type: Number,
        default: 1
      }
    }],
    userPreferences: {
      duration: {
        min: Number,
        max: Number
      },
      difficulty: [String],
      categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TestCategory'
      }]
    }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'expired'],
    default: 'pending'
  },
  metadata: {
    generatedAt: {
      type: Date,
      default: Date.now
    },
    validUntil: Date,
    algorithm: {
      name: String,
      version: String,
      parameters: mongoose.Schema.Types.Mixed
    }
  },
  feedback: {
    userRating: {
      type: Number,
      min: 1,
      max: 5
    },
    userComments: String,
    followedRecommendations: [{
      test: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test'
      },
      takenAt: Date,
      score: Number,
      successful: Boolean
    }]
  },
  analytics: {
    impressions: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    conversions: {
      type: Number,
      default: 0
    },
    effectiveness: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    }
  },
  customization: {
    displayOrder: {
      type: String,
      enum: ['priority', 'relevance', 'difficulty', 'duration'],
      default: 'priority'
    },
    maxRecommendations: {
      type: Number,
      default: 5
    },
    includeDescription: {
      type: Boolean,
      default: true
    },
    highlightUrgent: {
      type: Boolean,
      default: true
    }
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testType: {
    type: String,
    required: true
  },
  reason: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true,
  indexes: [
    { user: 1 },
    { baseTest: 1 },
    { 'metadata.status': 1 },
    { 'metadata.validUntil': 1 }
  ]
});

// Methods with suppressWarning
testRecommendationSchema.methods.validateRecommendation = function() {
  return this.isValid() && this.criteria.traits.every(trait => 
    trait.score >= trait.threshold.min && 
    trait.score <= trait.threshold.max
  );
}.bind(testRecommendationSchema.methods, { suppressWarning: true });

// Regular methods without 'validate' in the name
testRecommendationSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.status === 'active' &&
    (!this.metadata.validUntil || this.metadata.validUntil > now)
  );
};

testRecommendationSchema.methods.updateEffectiveness = function() {
  if (this.analytics.impressions > 0) {
    this.analytics.effectiveness = 
      (this.analytics.conversions / this.analytics.impressions);
  }
  return this.analytics.effectiveness;
};

// Virtual for active recommendations
testRecommendationSchema.virtual('activeRecommendations').get(function() {
  const now = new Date();
  return this.recommendedTests.filter(rec => 
    this.status === 'active' && 
    (!this.metadata.validUntil || this.metadata.validUntil > now)
  );
});

// Statics
testRecommendationSchema.statics.findActiveForUser = function(userId) {
  return this.find({
    user: userId,
    status: 'active',
    $or: [
      { 'metadata.validUntil': { $gt: new Date() } },
      { 'metadata.validUntil': null }
    ]
  });
};

// Middleware
testRecommendationSchema.pre('save', function(next) {
  if (!this.metadata.validUntil) {
    // Set default validity period (e.g., 30 days)
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    this.metadata.validUntil = validUntil;
  }
  
  if (this.isModified('analytics')) {
    this.updateEffectiveness();
  }
  
  next();
});

const TestRecommendation = mongoose.model('TestRecommendation', testRecommendationSchema);

module.exports = TestRecommendation;