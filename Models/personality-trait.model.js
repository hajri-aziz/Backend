const mongoose = require('mongoose');

const personalityTraitSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'Name is required'],
        trim: true,
        minlength: [2, 'Trait name must be at least 2 characters long'],
        maxlength: [100, 'Trait name cannot exceed 100 characters'],
        unique: true,
        index: true
    },
    description: { 
        type: String, 
        required: [true, 'Description is required'],
        minlength: [10, 'Description must be at least 10 characters long'],
        trim: true
    },
    category: { 
        type: String, 
        enum: {
            values: ['Big Five', 'MBTI', 'HEXACO', 'Custom'],
            message: '{VALUE} is not a supported category'
        },
        required: true 
    },
    measurementScale: {
        min: { 
            type: Number, 
            required: true,
            validate: {
                validator: Number.isFinite,
                message: 'Minimum scale value must be a valid number'
            }
        },
        max: { 
            type: Number, 
            required: true,
            validate: {
                validator: Number.isFinite,
                message: 'Maximum scale value must be a valid number'
            }
        }
    },
    metadata: {
        version: { 
            type: Number, 
            default: 1,
            min: [1, 'Version number cannot be less than 1']
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'archived'],
            default: 'active',
            index: true
        },
        updatedAt: { type: Date, default: Date.now }
    },
    relatedTraits: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'PersonalityTrait',
        validate: {
            validator: function(v) {
                return v && v.toString() !== this._id.toString();
            },
            message: 'A trait cannot be related to itself'
        }
    }],
    assessmentMethods: [{ 
        type: String,
        enum: ['questionnaire', 'observation', 'interview', 'behavioral'],
        validate: {
            validator: function(v) {
                return Array.isArray(v) && v.length > 0;
            },
            message: 'At least one assessment method is required'
        }
    }]
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Validate that max is greater than min
personalityTraitSchema.pre('validate', function(next) {
    if (this.measurementScale.max <= this.measurementScale.min) {
        this.invalidate('measurementScale.max', 'Maximum value must be greater than minimum value');
    }
    next();
});

// Update metadata version and timestamp on save
personalityTraitSchema.pre('save', function(next) {
    if (!this.metadata) this.metadata = {};
    
    if (this.isModified() && !this.isNew) {
        this.metadata.version += 1;
    }
    this.metadata.updatedAt = new Date();
    next();
});

// Method to validate a score
personalityTraitSchema.methods.validateScore = function(score) {
    if (!Number.isFinite(score)) {
        throw new Error('Score must be a valid number');
    }
    return score >= this.measurementScale.min && score <= this.measurementScale.max;
};

// Method to add related trait with validation
personalityTraitSchema.methods.addRelatedTrait = async function(traitId) {
    if (traitId.toString() === this._id.toString()) {
        throw new Error('Cannot relate a trait to itself');
    }
    
    if (!this.relatedTraits.includes(traitId)) {
        this.relatedTraits.push(traitId);
        await this.save();
    }
    return this;
};

// Static method to find by category with status filter
personalityTraitSchema.statics.findByCategory = function(category, status = 'active') {
    return this.find({ 
        category, 
        'metadata.status': status 
    }).sort('name');
};

// Create compound index for efficient querying
personalityTraitSchema.index({ category: 1, 'metadata.status': 1 });

// Ensure model isn't registered twice
const PersonalityTrait = mongoose.models.PersonalityTrait || mongoose.model('PersonalityTrait', personalityTraitSchema);

module.exports = PersonalityTrait;
