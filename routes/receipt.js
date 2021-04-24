const express = require('express')
const router = express.Router()
const Receipt = require('../schema/receipt')
const Category = require('../schema/category')
const Product = require('../schema/product')
const fs = require('fs');
const multer = require('multer')
const _ = require('lodash');
const Tesseract = require('tesseract.js');
const { split } = require('lodash');
var FuzzyMatching = require('fuzzy-matching');

var format = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
var categoryExpression = /^[0-9]{2}\-[A-Z]*/;
var catexp2 = /^[0-9]{2}[\s~-][A-Z]*/;
var productExpression = /"| *RJ *| *Rdo *| *HRJ *| *Rd *| *RQ *| *Ry *| *HRI *| * R *| *®J *| *RS *| *Wy *| *RI *"/
var dateExpression = /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}/;
var costExpression = /^[0-9]*\.[0-9]+$/;
var slipNumberExpression = "SLIP #"
var deal2Expression = / @ /
var shopname
var slipnumber
var content = ""
var date
var category = new Category({})
var receipt = {categories:[],saved:0}
var isCategoryFound = false
var folder='./receipts/'
const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        console.log("req in dest ",file.originalname)
        var result = file.originalname.split('_')
        var customeremail = result[0]
        var date = result[1]
        console.log("req ",req.body)
        var newDestination = folder+customeremail+date;
        var stat = null;
        try {
            stat = fs.statSync(newDestination);
        } catch (err) {
            fs.mkdirSync(newDestination);
        }
        if (stat && !stat.isDirectory()) {
            throw new Error('Directory cannot be created because an inode of a different type exists at "' + dest + '"');
        }       
        cb(null, newDestination);
        //cb(null,folder+req.body.customeremail+req.body.date);
    },
    filename:(req,file,cb) => {
        var result = file.originalname.split('_')
        var customeremail = result[0]
        var date = result[1]
        cb(null,customeremail+'_'+ Date.now()+'.jpg')
    }
})
const upload = multer({storage:storage});


function splitReceipt(text,filecount){
    content = content + text
    console.log("content ",content)
    var splits = text.split('\n');
    
    
    var check = '21-GROCERY'
    var separators = ["RJ","Rd","HRJ","Rdo","RQ","Ry"]

    
    findShopname(splits,receipt)
    
    

    let cat
    var product ={}
    //console.log("text content ",text)
    for(var i=0;i<splits.length;i++){
        findCategory(splits[i],receipt)
        findProduct(splits[i],receipt)
        if(splits[i].includes(" ea ")||splits[i].includes(" @ ")){
            console.log("coupon string ",splits[i])
            findDeal(splits[i],receipt,splits[i-1],splits[i+1])
        }

        if(dateExpression.test(splits[i])){
            //console.log("Date ",splits[i])
            date = splits[i]
        }else if(splits[i].includes(slipNumberExpression)){
            var slip = splits[i].replace(/[ &\/\\+()$~%\-'":;.,*?<>{}]/g,"")
            var sep = slip.split("#")
            slipnumber = sep[1]
            //console.log("Slip number ",slipnumber)

        }
    }
}

function findShopname(splits,receipt){
    if(!receipt.shopname){
    for(var i=0;i<splits.length;i++){
        if(splits[i].includes("SHOP AT")){
            receipt.shopname = splits[i+1]
        }
    }
    console.log("receipt ",receipt)
    //receipt.shopname = splits[3]
    console.log("shopname ",receipt.shopname)
    }    
}

function findCategory(split,receipt){
    if(categoryExpression.test(split)||catexp2.test(split)){
        //console.log("category expression true ",split)
        
        var c = split.split("-")
        if(c[1]!=undefined){
            var name = c[1].replace(/[^A-Z0-9]/g,"")
            receipt.categories.push({name:name,products:[]})
        }

        //console.log("receipt after category ",receipt)
    }
}

function findProduct(split,receipt){
    if(split.includes("RJ"|"Rd"|"HRJ"|"Rdo"|"RQ"|"Ry"|"HRI"|"RI"|" R "|" RS "|"®J"|"Wy")){
        var productsp = split.replace(/[&\/\\#+()$~%\-'":*?<>{}]/g," ")
        console.log("product after split ",productsp)   
        var prod = productsp.split(productExpression)
        console.log("prod length ",prod.length,"product ",prod)
        if(prod.length>=2){
        productname = prod[0].replace(/[^ A-Z]/g,"").trim()
        cost = prod[1].replace(" ","")
        console.log("cost value ",cost,"cost expression",costExpression.test(cost))
        
        if (costExpression.test(cost)) {
            if(productname!==""){
            product={productname:productname,cost:cost,deal:{description:"",dealcost:"",originalcost:"",dealtype:""}}
            receipt.categories[receipt.categories.length-1].products.push(product)
            console.log("added product ",receipt.categories[receipt.categories.length-1].products)
            }
        }
    }
    }
}

function findDeal(split,receipt,prod,price){
    
        
        var product = prod.replace(/[^ A-Z]/g,"").trim()
        if(product!==""){
        var rclength = receipt.categories.length
        var plength = receipt.categories[rclength-1].products.length
       
        var originalcost
        var deal=split
        console.log("deal before ",deal)
        if(deal.includes(" ea ")){
            var s = deal.split(" or ")
            if (s.length==2){
            originalcost = s[0].replace(" ea","")
            var dealcost = s[1].replace(/[^0-9.\/$]/g,"")
            var actualdeal = dealcost.split("/$")
            var dealc = parseFloat(actualdeal[1])/parseFloat(actualdeal[0])
            var org = originalcost.replace("$","")
            var saved = (parseFloat(org)-dealc)*parseFloat(actualdeal[0])
            console.log("savings ",saved)
            receipt.saved = receipt.saved + saved
            var p = {productname:product,cost:dealc,deal:{description:deal,dealcost:dealcost,originalcost:org,dealtype:"unit"}}
            receipt.categories[rclength-1].products.push(p)
        }
        
        }else if(deal2Expression.test(deal)){
            console.log("if @ deal ",deal)
            var s = deal.split(" @ ")
            if(s[1].includes("/k")){
                console.log("kg prod ",s[1])
                original = s[1].split("/k")
                var dealcost = original[0].replace("$","")
                var p = {productname:product,cost:dealcost,deal:{description:s[1],dealcost:dealcost,originalcost:"",dealtype:"weight"}}
                receipt.categories[rclength-1].products.push(p)
            }
        }
    }
}

const saveReceipt = async(r) =>{
    var threshold = 0.7
    var pm = new FuzzyMatching()
    var products = await Product.find({ },{productname:1,_id:1})
    var prs ={}
    products.forEach(item=>{
        pm.add(item.productname)
        prs[item.productname]=item._id
    })
    for(var i=0;i<r.categories.length;i++){
        var categories = await Category.find({ },{name:1,_id:0})
        //console.log("category names ",categories)
        var fm = new FuzzyMatching()
        categories.forEach(item=>{
            fm.add(item.name)
        })
        var dist = fm.get(r.categories[i].name, { maxChanges: 3 })
        //console.log("distance ",dist)
        if(dist.distance<threshold){
            var category = new Category({name:r.categories[i].name})
            category.save()
            //console.log("saved category ",category)
        }
        for(var j=0;j<r.categories[i].products.length;j++){
            //console.log("add",r.categories[i].products[j].productname)
            var match = pm.get(r.categories[i].products[j].productname)

            if(match.distance<threshold){
                var p = new Product()
                p.available.push({shopname:r.shopname,cost:r.categories[i].products[j].cost,deal:r.categories[i].products[j].deal,date:r.dateposted})
                p.productname = r.categories[i].products[j].productname
                p.category = r.categories[i].name
                //console.log("product saving ",p.available[0].deal)
                p.save()
            }else{
                var productModified = false
                //console.log("match value ",match.value)
                var p = await Product.findById(prs[match.value])
                //console.log("found prod ",p)
                var pr = {}
                p.available.forEach(item=>{
                    pr[item.shopname]=item
                })
                if(!pr.hasOwnProperty(r.shopname)){
                    //p.available = p.available.reverse()
                   /* p.available.forEach(av => {
                        if(av.date===r.dateposted && productModified == false){
                            
                            console.log("Date match ",r.shopname,p.productname)
                            av.shopname=r.shopname
                            productModified=true
                            //pr[av.shopname]=av
                        }else if(productModified==false){*/
                            console.log("adding prod with new shop ",r.shopname,p.productname)
                            p.available.push({shopname:r.shopname,
                                cost:r.categories[i].products[j].cost,
                                deal:r.categories[i].products[j].deal,
                                date:r.dateposted})
                            //pr[av.shopname]=av
                            //console.log("product saving ",p)
                        //}
                    //})
                    //console.log("saving prod ",JSON.stringify(p))
                    p.save()
                    var n = await Product.find()
                    //console.log("after save ",JSON.stringify(n))
                        
                }/*else {
                        p.available.forEach(av => {
                            if(av.date!==r.dateposted){
                                av.shopname=r.shopname
                            }
                        })
                    }*/
                }
            }
        }   
    r.save()
}

const analyze = async(dest,req,res) => {
    var filecount = 0;
    content = ""
    receipt = {categories:[],saved:0}
    fs.readdir(dest, async(err, files) => {
        files.forEach(file => {
            console.log(file);
            Tesseract.recognize(
                dest + '/' + file,
                'eng', { //logger:m => console.log(m)
            }
            ).then(async({ data: { text } }) => {
                splitReceipt(text, filecount);
                
                filecount = filecount + 1;
                if(filecount==files.length){
                    var r = new Receipt()
                    r.isReviewed = false
                    r.customeremail = req.body.customeremail;
                    r.receipt = content;
                    r.slipnumber = slipnumber
                    r.date = date
                    r.dateposted = new Date()
                    r.categories = receipt.categories
                    r.shopname = receipt.shopname
                    r.saved = receipt.saved
                    //console.log("receipt before save ",r)
                    saveReceipt(r)
                    res.json({shopname:receipt.shopname})
                }
            });
        })
        
    })

    
    
}

router.get('/getreview/:user/', async (req,res) => {
    console.log("hitting get review ",req.params.user)
    let receipt
    try{
       receipt = await Receipt.findOne({"customeremail": req.params.user,"isReviewed":false});
       console.log("receipt -> ",receipt._id)
       res.json(receipt)
    }catch(e){
       res.status(500).json({message: e.message})
    }
 })

router.post('/analyse',async(req,res)=>{

    try{
        var newDestination = folder+req.body.customeremail+req.body.date;
        analyze(newDestination,req,res)    
    }catch(error){
        console.log(error)
    }
    
})

router.post('/save',async(req,res)=>{
    try{
        receipt = await Receipt.findById(req.body.id);
        console.log("shop name ",receipt._id)
        var shopname = req.body.shopname
        console.log("rew",req.body.id)
        receipt.shopname = shopname
        receipt.isReviewed = true
        //saveReceipt(receipt)
        var products = await Product.find({"available.date":receipt.dateposted})
        console.log("products ",products)
        products.forEach(product =>{
            console.log("product name ",product.productname)
            product.available.forEach(available =>{
                if(available.date === receipt.dateposted){
                    available.shopname = shopname
                    console.log("shopname available ",available.shopname)
                }
            })
            product.save()
            //var p = Product.findById(product._id)
            //console.log("saved product ",JSON.stringify(p))
        })
        receipt.save()

    }catch(error){
        console.log(error)
    }
    
})

router.get('/saveyes/:id',async(req,res)=>{
    try{
        receipt = await Receipt.findById(req.params.id);
        receipt.isReviewed = true
        receipt.save()
        res.json({message:"saved"})
    
    }catch(error){
        console.log(error)
    }
    
})

router.post('/upload',upload.single('receipt'),(req,res)=>{
    console.log("files ",req.file)
    customeremail = req.body.customeremail
    date = req.body.date
    //uploadFiles(req,res);
    res.json({message:content})
})

router.get('/getreceipts/:user', async (req,res) => {
    console.log("hitting get receipts for user ",req.params.user)
    let receipts
    try{
       receipts = await Receipt.find({"customeremail": new RegExp(req.params.user,'i')});
       //console.log("category products -> ",products)
       res.json(receipts)
    }catch(e){
       res.status(500).json({message: e.message})
    }
 })

 router.get('/recommend/:user', async (req,res) => {
    console.log("hitting get recommendation for user ",req.params.user)
    let receipts
    var recommend = []
    
    try{
       receipts = await Receipt.find({"customeremail": req.params.user});
       
       receipts.forEach(async receipt=>{
            var products = await Product.find({"available.date":receipt.dateposted})
            //console.log("products ",products)
            products.forEach(product=>{
                var p = {}
                if(product.available.length>1){
                    var userGot = product.available.find(o=>o.date===receipt.dateposted)
                    
                    //console.log("user got ",product.productname,userGot)
                    var min = parseFloat(product.available[0].cost)
                    for(var i=0;i<product.available.length;i++){
                        if(min > parseFloat(product.available[i].cost)){
                            min = parseFloat(product.available[i].cost)
                        }         
                    }
                    //console.log("minimum cost of ",product.productname,min.toString())
                    if(userGot.cost!==min.toString()){
                        //console.log("minimum not equal for ",product.productname)
                        var minimumfound = product.available.find(o=>o.cost===min.toString())
                        //console.log("lower cost found in ",minimumfound)
                        if(minimumfound){
                            console.log("minimun ",product.productname)
                            p["userGot"]=userGot
                            p["minimumfound"]=minimumfound
                            p["productname"]=product.productname
                            recommend.push(p)
                            console.log("recommend ",recommend)
                        }
                    }
                    //console.log("recommended ",recommend)

                }
            })
            console.log("recommended ",recommend)
            res.json(recommend)

       })
        
       //console.log("recommended ",recommend)
       //res.json(recommend)
    }catch(e){
       res.status(500).json({message: e.message})
    }
 })

 




module.exports = router