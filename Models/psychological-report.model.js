const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PsychologicalReportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  psychologistId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  relatedTests: [{ type: Schema.Types.ObjectId, ref: 'TestSession' }],
  status: { 
    type: String, 
    required: true,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    default: 'DRAFT'
  },
  visibility: { 
    type: String, 
    required: true,
    enum: ['PATIENT_ONLY', 'PSYCHOLOGIST_ONLY', 'PATIENT_AND_PSYCHOLOGIST'],
    default: 'PSYCHOLOGIST_ONLY'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PsychologicalReport', PsychologicalReportSchema);