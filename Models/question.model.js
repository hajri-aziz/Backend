const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['multiple_choice', 'likert_scale', 'open_ended', 'true_false', 'ranking'],
    default: 'multiple_choice'
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCategory',
    required: true
  },
  options: [{
    text: {
      type: String,
      required: function() { 
        return ['multiple_choice', 'likert_scale', 'ranking'].includes(this.type);
      }
    },
    value: {
      type: Number,
      required: function() {
        return ['multiple_choice', 'likert_scale'].includes(this.type);
      }
    },
    traits: [{
      trait: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PersonalityTrait'
      },
      weight: {
        type: Number,
        default: 1
      }
    }]
  }],
  scoring: {
    method: {
      type: String,
      enum: ['simple', 'weighted', 'complex', 'custom'],
      default: 'simple'
    },
    algorithm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestScoringAlgorithm'
    },
    maxScore: {
      type: Number,
      required: true,
      default: 1
    }
  },
  metadata: {
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    timeEstimate: {
      type: Number, // in seconds
      default: 30
    },
    language: {
      type: String,
      default: 'en'
    },
    version: {
      type: Number,
      default: 1
    }
  },
  validation: {
    required: {
      type: Boolean,
      default: true
    },
    minLength: Number,
    maxLength: Number,
    pattern: String,
    customValidation: {
      type: String,
      enum: ['none', 'email', 'number', 'date', 'custom'],
      default: 'none'
    }
  },
  dependencies: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    condition: {
      type: String,
      enum: ['equals', 'not_equals', 'greater_than', 'less_than', 'contains'],
      required: true
    },
    value: mongoose.Schema.Types.Mixed
  }],
  feedback: {
    immediate: {
      enabled: {
        type: Boolean,
        default: false
      },
      content: String
    },
    conditional: [{
      condition: {
        answer: mongoose.Schema.Types.Mixed,
        operator: {
          type: String,
          enum: ['equals', 'contains', 'greater_than', 'less_than']
        }
      },
      content: String
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true,
  indexes: [
    { category: 1 },
    { type: 1 },
    { 'metadata.difficulty': 1 },
    { status: 1 }
  ]
});

// Methods
questionSchema.methods.checkAnswer = function(answer) {
  // Implementation depends on question type
  switch(this.type) {
    case 'multiple_choice':
      return this.options.some(opt => opt.value === answer);
    case 'likert_scale':
      return answer >= 1 && answer <= this.options.length;
    case 'true_false':
      return typeof answer === 'boolean';
    case 'open_ended':
      return typeof answer === 'string' && 
             (!this.validation.minLength || answer.length >= this.validation.minLength) &&
             (!this.validation.maxLength || answer.length <= this.validation.maxLength);
    default:
      return true;
  }
}.bind(questionSchema.methods, { suppressWarning: true });

// Middleware
questionSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.metadata.version += 1;
  }
  next();
});

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;