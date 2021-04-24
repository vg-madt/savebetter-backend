const mongoose = require('mongoose')
const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');

const productSchema = new mongoose.Schema({
            
    productname:String,
    category:String,
    available:[{
        date:String,
        shopname:String,
        cost:String,
        deal:{
            description:String,
            dealcost:String,
            originalcost:String,
            dealtype:String
        }
    }],
    
})

productSchema.plugin(mongoose_fuzzy_searching, { fields: ['productname'] })

module.exports = mongoose.model('Product', productSchema)