const mongo=require('mongoose')
const Schema = mongo.Schema;


const Disponibilities=new Schema({
    id_psychologue: { type: mongo.Schema.Types.ObjectId, ref: "user", required: true },
    date: { type: Date, required: true },
    heure_debut: { type: String, required: true },
    heure_fin: { type: String, required: true },
    statut: { type: String, enum: ['disponible', 'occupé'], required: true }
})

module.exports=mongo.model('disponibilties',Disponibilities)