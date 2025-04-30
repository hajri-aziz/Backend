const mongo=require('mongoose');
const Schema=mongo.Schema;
const Review=new Schema({
    user_id:String,
    cours_id:String,
    review:String,
    rating:Number,
    created_at:Date,
    updated_at:Date
});

module.exports=mongo.model('Review',Review);