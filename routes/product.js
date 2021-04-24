const express = require('express')
const router = express.Router()
const Product = require('../schema/product')



//get product by category
router.get('/getfrom/:category', async (req,res) => {
    console.log("hitting search by category ",req.params.category)
    let products
    try{
       products = await Product.find({"category": new RegExp(req.params.category,'i')});
       //console.log("category products -> ",products)
       res.json(products)
    }catch(e){
       res.status(500).json({message: e.message})
    }
 })

 router.get('/getById/:id', async (req,res) => {
    console.log("hitting search by category ",req.params.id)
    let product
    try{
       product = await Product.findById(req.params.id);
       //console.log("category products -> ",products)
       res.json(product)
    }catch(e){
       res.status(500).json({message: e.message})
    }
 })


 router.get('/get/deal', async (req,res) => {
    //console.log("searching deals ")
    let products
    try{
       products = await Product.find({"available.deal.description": { $ne: "" }});
       //console.log("category products -> ",products)
       res.json(products)
    }catch(e){
       res.status(500).json({message: e.message})
    }
 })

 router.get('/search/:name', async (req,res) => {
    //console.log("searching deals ")
    console.log("request param ",req.params)
    let products
    var prods = []
    const regex = new RegExp((req.params.name), 'gi');
    try{
        if(req.params.name.length>=1){
            products = await Product.fuzzySearch(req.params.name)
            products.forEach(element => {
                if(element._doc.confidenceScore>2){
                    prods.push(element)
                }
            });
            console.log("category products -> ",prods)
            res.json(prods)
        }
        if(req.params.name===undefined){
            console.log("req params is empty")
            prods = []
            res.json(prods)
        }
    
    
    }catch(e){
       res.status(500).json({message: e.message})
    }
 })

 module.exports = router