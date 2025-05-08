// models/Notification.js
const mongo=require('mongoose')
const Schema=mongo.Schema

const notificationSchema = new Schema({
  id_patient: { type: mongo.Schema.Types.ObjectId, ref: "user", required: true },
  //id_patient:{ type: mongo.Schema.Types.ObjectId },
  type: { type: String, enum: ["rendezvous", "evenement"], required: true },
  id_cible: { type: mongo.Schema.Types.ObjectId, required: true }, // id du rendez-vous ou événement
  message: { type: String, required: true },
  lu: { type: Boolean, default: false },
  date_envoi: { type: Date, default: Date.now },
  envoye: { type: Boolean, default: false }, // <--- Ajouté
  date_rappel: { type: Date }, // si besoin d’un rappel
});

module.exports = mongo.model("Notification", notificationSchema);
