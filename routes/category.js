const express = require('express')
const router = express.Router()
const Category = require('../schema/category')


//get product by category
router.get('/all', async (req,res) => {
    //console.log("hitting search for all category ")
    let categories
    try{
       categories = await Category.find();
       //console.log("category products -> ",products)
       res.json(categories)
    }catch(e){
       res.status(500).json({message: e.message})
    }
 })

 module.exports = router