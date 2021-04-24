const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        minlength: 3
    },
    phone: {
        type: String
    },
    address: {
        type: String
    }
},{
    timestamps: true,
})

module.exports = mongoose.model('User', userSchema)