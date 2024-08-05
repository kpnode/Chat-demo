    const mongoose = require('mongoose');
    const he = require('he'); // Import HTML encoding library

    const chatSchema = new mongoose.Schema({
        sender_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        receiver_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user'
        },
        msg:{
            type: String,
        },
        isRead: { type: Boolean, default: false }
    },{ timestamps: true, versionKey: false });

    // // Middleware to encode HTML entities and replace newline characters before saving
    // chatSchema.pre('save', function(next) {
    //     // Encode HTML entities
    //     this.msg = he.encode(this.msg);
    //     // Replace newline characters with <br> tags
    //     this.msg = this.msg.replace(/\n/g, '<br>');
    //     next();
    // });

    module.exports = mongoose.model('chat', chatSchema);
