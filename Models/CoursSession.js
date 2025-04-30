const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CoursSessionSchema = new Schema({
    title: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 100
    },
    cours_id: {
        type: Schema.Types.ObjectId,
        ref: 'Cours',
        required: true
    },
    video_url: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    startdate: {
        type: Date,
        required: true
    },
    enddate: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    capacity: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'completed', 'scheduled', 'in-progress', 'cancelled'],
        required: true
    },
    // Modified participants array to use proper ObjectId references
    participants: [{
        user_id: {
            type: Schema.Types.ObjectId,
            ref: 'user',
            required: true
        },
        inscription_date: {
            type: Date,
            default: Date.now
        },
        notified: {
            type: Boolean,
            default: false
        },
        reminders_sent: {
            type: Number,
            default: 0
        }
    }],
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CoursSession', CoursSessionSchema);