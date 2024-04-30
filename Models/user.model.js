const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    accountNumber: {type:Number, unique: true},
    // email: { type: String, unique: true},
    password: { type: String, required: true },
    emailLink: {
        email: { type: String, required: true, unique: true },
        verified: { type: Boolean, default: false },
        verificationToken: { type: String }
    },

});

const  User = mongoose.model('User', userSchema);

module.exports = User;