const mongoose = require('mongoose')

const receiptSchema = new mongoose.Schema({
    shopname: {
        type: String,
    },
    date: {
        type: String,
    },
    dateposted:{
        type:String,
        required: true
    },
    receipt:{
        type:String
    },
    customeremail:{
        type:String,    
    },
    slipnumber:{
        type:String
    },
    saved:{
        type:Number
    },
    isReviewed:{
        type:Boolean
    },
    categories:[{
        name:String,
        products:[{
            productname:String,
            cost:String,
            deal:{
                description:String,
                dealcost:String,
                originalcost:String,
                dealtype:String
            }
        }]
    }]
})

module.exports = mongoose.model('Receipt', receiptSchema)