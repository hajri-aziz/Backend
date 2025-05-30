const mongoose = require('mongoose');
const { Schema } = mongoose;

// 1) On « require » d’abord les modèles référencés pour que Mongoose les connaisse :
require('./CoursCategory');
require('./User');   // votre modèle User est exporté sous le nom 'user'

// 2) Puis on définit le schéma des Cours
const CoursSchema = new Schema({
  title:        { type: String,  required: true, minlength: 3, maxlength: 100 },
  description:  { type: String,  required: true, minlength: 10, maxlength: 500 },

  price:        { type: Number,  required: true },
  currency:     { type: String,  enum: ['TND'], default: 'TND' },

  category_id: {
    type: Schema.Types.ObjectId,
    ref:  'CoursCategory',  // correspond au modèle CoursCategory
    required: true
  },
  instructor_id: {
    type: Schema.Types.ObjectId,
    ref:  'user',           // doit matcher le nom exact de votre modèle User
    required: true
  },

  image: { type: String, default: '' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// 3) Enfin on exporte le modèle Cours
module.exports = mongoose.models.Cours ||
                 mongoose.model('Cours', CoursSchema);
