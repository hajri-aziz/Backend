const mongo=require('mongoose')
const Schema=mongo.Schema


const RendezVous=new Schema({
    id_psychologue:{ type: mongo.Schema.Types.ObjectId, ref: "user", required: true },
    id_patient:{ type: mongo.Schema.Types.ObjectId, ref: "user", required: true },
    date:Date,
    heure:String,
    motif:String,
    statut: { type: String, enum: ["en attente", "confirmé", "annulé"], default: "en attente" }
})

module.exports=mongo.model('rendezvous',RendezVous)