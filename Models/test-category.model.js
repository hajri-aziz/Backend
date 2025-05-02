const mongoose = require('mongoose');

const testCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Category description is required'],
    trim: true
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestCategory',
    default: null
  },
  psychologicalDimensions: [{
    dimension: {
      type: String,
      required: true
    },
    weight: {
      type: Number,
      default: 1,
      min: 0,
      max: 1
    },
    description: String
  }],
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    version: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active'
    },
    icon: String,
    color: String
  },
  ageRange: {
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 100
    }
  },
  recommendedDuration: {
    min: {
      type: Number, // in minutes
      default: 15
    },
    max: {
      type: Number,
      default: 60
    }
  },
  prerequisites: [{
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestCategory'
    },
    minimumScore: {
      type: Number,
      min: 0,
      max: 100
    },
    required: {
      type: Boolean,
      default: false
    }
  }],
  validationCriteria: {
    minimumQuestions: {
      type: Number,
      default: 10
    },
    requiredTraits: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PersonalityTrait'
    }],
    scoringMethods: [{
      type: String,
      enum: ['simple', 'weighted', 'complex', 'custom']
    }]
  },
  resources: [{
    title: String,
    type: {
      type: String,
      enum: ['article', 'video', 'document', 'link'],
      required: true
    },
    url: String,
    description: String
  }]
}, {
  timestamps: true,
  indexes: [
    { name: 1 },
    { parentCategory: 1 },
    { 'metadata.status': 1 }
  ]
});

// Virtual for child categories
testCategorySchema.virtual('childCategories', {
  ref: 'TestCategory',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Methods
// Renamed from validate to checkAgeRequirement
testCategorySchema.methods.checkAgeRequirement = function(age) {
  return age >= this.ageRange.min && age <= this.ageRange.max;
}.bind(testCategorySchema.methods, { suppressWarning: true });

// Regular methods without 'validate' in the name
testCategorySchema.methods.getFullPath = async function() {
  let path = [this.name];
  let currentCategory = this;
  
  while (currentCategory.parentCategory) {
    currentCategory = await this.model('TestCategory').findById(currentCategory.parentCategory);
    if (currentCategory) {
      path.unshift(currentCategory.name);
    }
  }
  
  return path.join(' > ');
};

// Middleware
testCategorySchema.pre('save', function(next) {
  if (this.isModified()) {
    this.metadata.version += 1;
  }
  next();
});

const TestCategory = mongoose.model('TestCategory', testCategorySchema);

module.exports = TestCategory;