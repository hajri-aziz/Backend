const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const testSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true,
    minlength: [2, 'Test name must be at least 2 characters long'],
    maxlength: [100, 'Test name cannot exceed 100 characters'],
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters long']
  },
  type: {
    type: String,
    required: true,
    enum: ['personality', 'aptitude', 'interest']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCategory',
    required: [true, 'Test category is required']
  },
  duration: {
    minimum: {
      type: Number,
      required: true,
      min: 0
    },
    maximum: {
      type: Number,
      required: true,
      min: 0
    },
    estimated: {
      type: Number,
      required: true,
      min: 0
    }
  },
  configuration: {
    maxScore: {
      type: Number,
      required: true,
      min: 0
    },
    passingScore: {
      type: Number,
      required: true,
      min: 0
    },
    allowRetake: {
      type: Boolean,
      default: true
    },
    showResults: {
      type: Boolean,
      default: true
    }
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  }],
  scoringAlgorithm: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestScoringAlgorithm',
    required: [true, 'Scoring algorithm is required']
  },
  traits: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PersonalityTrait'
  }],
  targetTraits: [{
    trait: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PersonalityTrait',
      required: true
    },
    weight: {
      type: Number,
      min: 0,
      max: 1,
      default: 1
    }
  }],
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft'
    },
    version: {
      type: Number,
      default: 1
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    reliability: {
      type: Number,
      min: 0,
      max: 1
    },
    validationStatus: {
      type: String,
      enum: ['pending', 'validated', 'rejected'],
      default: 'pending'
    }
  },
  requirements: {
    minimumAge: {
      type: Number,
      default: 0
    },
    prerequisites: [{
      test: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Test'
      },
      minimumScore: {
        type: Number,
        min: 0,
        max: 100
      }
    }],
    restrictions: [{
      type: String,
      trim: true
    }]
  },
  localization: {
    languages: [{
      type: String,
      trim: true
    }],
    defaultLanguage: {
      type: String,
      default: 'en'
    }
  },
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCategory'
  }]
}, {
  timestamps: true,
  versionKey: '__v'
});

testSchema.plugin(mongoosePaginate);

// Single index definition for name
testSchema.index({ name: 1 });

// Validate durations
testSchema.pre('validate', function(next) {
  if (this.duration.maximum <= this.duration.estimated) {
    this.invalidate('duration.maximum', 'Maximum duration must be greater than estimated duration');
  }
  next();
});

// Update version on modification
testSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.metadata.version += 1;
  }
  next();
});

// Method to check if prerequisites are met for a session
testSchema.methods.checkPrerequisites = async function(anonymousId) {
  const TestSession = mongoose.model('TestSession');
  
  for (const prereq of this.requirements.prerequisites) {
    const session = await TestSession.findOne({
      anonymousId,
      test: prereq.test,
      'metadata.status': 'completed'
    }).sort('-completedAt');
    
    if (!session || session.score < prereq.minimumScore) {
      return false;
    }
  }
  return true;
};

// Method to validate test configuration
testSchema.methods.validate = async function() {
  // Check if all questions exist
  const Question = mongoose.model('Question');
  const questions = await Question.find({ _id: { $in: this.questions } });
  if (questions.length !== this.questions.length) {
    throw new Error('Some questions do not exist');
  }
  
  // Check if scoring algorithm exists
  const TestScoringAlgorithm = mongoose.model('TestScoringAlgorithm');
  const algorithm = await TestScoringAlgorithm.findById(this.scoringAlgorithm);
  if (!algorithm) {
    throw new Error('Scoring algorithm does not exist');
  }
  
  // Check if all target traits exist
  const PersonalityTrait = mongoose.model('PersonalityTrait');
  for (const target of this.targetTraits) {
    const trait = await PersonalityTrait.findById(target.trait);
    if (!trait) {
      throw new Error(`Target trait ${target.trait} does not exist`);
    }
  }
  
  return true;
};

// Static method to find active tests by category
testSchema.statics.findActiveByCategory = function(categoryId) {
  return this.find({
    category: categoryId,
    'metadata.status': 'active'
  }).populate('category');
};

const Test = mongoose.model('Test', testSchema);

module.exports = Test;
