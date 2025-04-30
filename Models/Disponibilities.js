const mongo=require('mongoose')
const Schema = mongo.Schema;


const Disponibilities=new Schema({
    id_psychologue: { type: mongo.Schema.Types.ObjectId, ref: "User", required: true },
    date:Date,
    heure_debut:String,
    heure_fin:String,
    statut:String
})

module.exports=mongo.model('disponibilties',Disponibilities)