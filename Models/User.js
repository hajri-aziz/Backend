const mongo = require('mongoose')
//pour definir le schema de cette entiter
const Schema = mongo.Schema
const User = new Schema({
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true, unique: true},
    password: { type: String, required: true },
    role: { type: String },
    dateInscription: { type: Date, default: Date.now },
    isAnonymous: { type: Boolean, default: false },
    dateNaissance: { type: Date, required: true },
    otpCode: { type: String },
    otpExpires: { type: Date },
    isApproved: { type: Boolean, default: false },
    telephone: { type: String },  // Utiliser String pour les numéros
    status: { type: String, enum: ['autorisé', 'non autorisé'], default: 'autorisé' },
    profileImage: { type: String, default: '' } // Valeur par défaut pour les images de profil
});


module.exports = mongo.model('user', User) 
