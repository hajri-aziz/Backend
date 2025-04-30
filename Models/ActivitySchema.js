const mongo = require('mongoose'); // Utilise mongo, pas mongoose directement
// pour définir le schéma de cette entité
const Schema = mongo.Schema;

const ActivitySchema = new Schema({
 user: { type: mongo.Schema.Types.ObjectId, ref: 'user', required: true },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongo.model('Activity', ActivitySchema); 
