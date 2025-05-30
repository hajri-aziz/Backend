const mongoose = require('mongoose');
const { Schema } = mongoose;

const CoursCategorySchema = new Schema({
  title: {
    type:     String,
    required: true,
    trim:     true,
    minlength: 3,
    maxlength: 100
  },
  description: {
    type:     String,
    required: true,
    trim:     true,
    minlength: 10,
    maxlength: 500
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// On enregistre le modèle sous le nom « CoursCategory »
module.exports = mongoose.models.CoursCategory ||
                 mongoose.model('CoursCategory', CoursCategorySchema);
