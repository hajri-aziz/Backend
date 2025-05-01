const mongoose = require('mongoose');

const testScoringAlgorithmSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Algorithm name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Algorithm description is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['simple', 'weighted', 'adaptive', 'custom', 'standardized'],
    required: true
  },
  configuration: {
    baseScore: {
      type: Number,
      default: 0
    },
    maxScore: {
      type: Number,
      required: true
    },
    weights: {
      correctAnswer: {
        type: Number,
        default: 1
      },
      timeBonus: {
        enabled: {
          type: Boolean,
          default: false
        },
        factor: {
          type: Number,
          default: 0.1
        }
      },
      consistencyPenalty: {
        enabled: {
          type: Boolean,
          default: false
        },
        factor: {
          type: Number,
          default: 0.1
        }
      }
    },
    normalization: {
      method: {
        type: String,
        enum: ['none', 'z-score', 'percentile', 'custom'],
        default: 'none'
      },
      parameters: {
        mean: Number,
        standardDeviation: Number,
        customFormula: String
      }
    }
  },
  traitCalculations: [{
    trait: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PersonalityTrait'
    },
    formula: {
      type: String,
      default: 'sum'  // Making formula optional with a default value
    },
    weight: {
      type: Number,
      default: 1
    },
    threshold: {
      min: Number,
      max: Number
    }
  }],
  adaptiveRules: [{
    condition: {
      type: String,
      enum: ['score_threshold', 'time_threshold', 'pattern_match', 'custom'],
      required: function() {
        return this.type === 'adaptive';
      }
    },
    threshold: mongoose.Schema.Types.Mixed,
    adjustment: {
      type: {
        type: String,
        enum: ['multiply', 'add', 'set', 'custom'],
        required: true
      },
      value: Number
    }
  }],
  metadata: {
    version: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ['active', 'deprecated', 'testing'],
      default: 'testing'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    validationStatus: {
      isValidated: {
        type: Boolean,
        default: false
      },
      validatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      validatedAt: Date
    }
  },
  statistics: {
    usageCount: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    standardDeviation: {
      type: Number,
      default: 0
    },
    reliability: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    }
  },
  validation: {
    testCases: [{
      input: mongoose.Schema.Types.Mixed,
      expectedOutput: mongoose.Schema.Types.Mixed,
      passed: Boolean,
      error: String
    }],
    lastValidated: Date,
    validationErrors: [String]
  }
}, {
  timestamps: true,
  indexes: [
    { name: 1 },
    { type: 1 },
    { 'metadata.status': 1 }
  ]
});

// Methods
testScoringAlgorithmSchema.methods.calculateScore = function(responses) {
  let score = this.configuration.baseScore;
  
  switch(this.type) {
    case 'simple':
      score = this.calculateSimpleScore(responses);
      break;
    case 'weighted':
      score = this.calculateWeightedScore(responses);
      break;
    case 'adaptive':
      score = this.calculateAdaptiveScore(responses);
      break;
    case 'custom':
      score = this.calculateCustomScore(responses);
      break;
  }
  
  return this.normalizeScore(score);
};

testScoringAlgorithmSchema.methods.calculateSimpleScore = function(responses) {
  return responses.reduce((total, response) => {
    return total + (response.isCorrect ? this.configuration.weights.correctAnswer : 0);
  }, 0);
};

testScoringAlgorithmSchema.methods.normalizeScore = function(score) {
  switch(this.configuration.normalization.method) {
    case 'z-score':
      return this.calculateZScore(score);
    case 'percentile':
      return this.calculatePercentile(score);
    case 'custom':
      return this.calculateCustomNormalization(score);
    default:
      return score;
  }
};

testScoringAlgorithmSchema.methods.calculateZScore = function(score) {
  const { mean, standardDeviation } = this.configuration.normalization.parameters;
  if (!mean || !standardDeviation) {
    return score; // Return raw score if parameters are missing
  }
  return (score - mean) / standardDeviation;
};

testScoringAlgorithmSchema.methods.calculatePercentile = function(score) {
  // Assumes statistics.averageScore and statistics.standardDeviation are maintained
  const { averageScore, standardDeviation } = this.statistics;
  if (!averageScore || !standardDeviation) {
    return score; // Return raw score if statistics are not available
  }
  
  // Using cumulative normal distribution approximation
  const z = (score - averageScore) / standardDeviation;
  const percentile = 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  return percentile * 100; // Convert to percentage
};

testScoringAlgorithmSchema.methods.calculateCustomNormalization = function(score) {
  const { customFormula } = this.configuration.normalization.parameters;
  if (!customFormula) {
    return score;
  }
  
  try {
    // Basic formula evaluation (for safety, in production you might want to use a proper formula parser)
    const formula = customFormula.replace(/score/g, score);
    return eval(formula); // Note: In production, use a safer evaluation method
  } catch (error) {
    console.error('Error in custom normalization:', error);
    return score;
  }
};

// Helper function for percentile calculation (error function)
testScoringAlgorithmSchema.methods.erf = function(x) {
  // Polynomial approximation of the error function
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
};

// Methods with suppressWarning
testScoringAlgorithmSchema.methods.validateResults = function(results) {
  // Validation logic
  return results.every(result => 
    result.score >= 0 && 
    result.score <= this.configuration.maxScore
  );
}.bind(testScoringAlgorithmSchema.methods, { suppressWarning: true });

testScoringAlgorithmSchema.methods.validate = async function() {
  // Existing validation logic
  if (this.type === 'adaptive' && !this.adaptiveRules?.length) {
    throw new Error('Adaptive scoring requires at least one rule');
  }
  return true;
}.bind(testScoringAlgorithmSchema.methods, { suppressWarning: true });

// Middleware
testScoringAlgorithmSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.metadata.version += 1;
  }
  next();
});

// Change model registration to prevent duplicates
const TestScoringAlgorithm = mongoose.models.TestScoringAlgorithm || mongoose.model('TestScoringAlgorithm', testScoringAlgorithmSchema);

module.exports = TestScoringAlgorithm;

