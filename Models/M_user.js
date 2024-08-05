    const mongoose = require('mongoose');

    const userSchema = new mongoose.Schema({
        name: {
            type: String,
            required: true
        },
        picture: {
            type: String,
        },
        email:{
            type: String,
            required: true
        },
        password:{
            type: String,
            required: true
        },
        caption:{
            type: String,
            required: true,
            default: "Hii,i am using Chatapp"
        },
        is_active:{
            type: Boolean,  
            default: false
        }
    },{timestamps: true,versionKey: false});
    module.exports = mongoose.model('User', userSchema);


