const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
        name:String,
        shopname:String
})

module.exports = mongoose.model('Category', categorySchema)