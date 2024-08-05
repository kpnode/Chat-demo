const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    other_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    last_msg:{
        type: String,
    },
    last_msg_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'chat'
    },
},{ timestamps: true, versionKey: false });

// // Middleware to encode HTML entities and replace newline characters before saving
// chatSchema.pre('save', function(next) {
//     // Encode HTML entities
//     this.msg = he.encode(this.msg);
//     // Replace newline characters with <br> tags
//     this.msg = this.msg.replace(/\n/g, '<br>');
//     next();
// });

module.exports = mongoose.model('room', roomSchema);
