const mongo=require('mongoose');
const Schema=mongo.Schema;
const Certificat=new Schema({
    user_id:String,
    cours_id:String,
    cours_session_id:String,
    issueddate:Date,
    status:String,
    certificate_url:String,
    created_at:Date,
    updated_at:Date
});
module.exports=mongo.model('certificat',Certificat);

