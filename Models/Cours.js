const mongoose = require('mongoose');
const { Schema } = mongoose;

const CoursSchema = new Schema({
  title:       { type: String,  required: true, minlength: 3, maxlength: 100 },
  description: { type: String,  required: true, minlength: 10, maxlength: 500 },
  
  // Séparation des champs
  price:    { type: Number, required: true },
  currency: { type: String, enum: ['TND'], default: 'TND' },
  
  category_id:   { type: Schema.Types.ObjectId, ref: 'CoursCategory', required: true },
  instructor_id: { type: Schema.Types.ObjectId, ref: 'user',           required: true },

  image: { type: String, default: '' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Cours', CoursSchema);
