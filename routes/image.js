const express = require('express')
const router = express.Router()
var fs = require('fs')
var FuzzyMatching = require('fuzzy-matching');
var categoryImages = ["meat","seafood","grocery","dairy","produce","weight","unit"]
//get category image
router.get('/:id', async (req,res) => {
    var fm = new FuzzyMatching(categoryImages)
    var image
    var threshold = 0.6
    try{
        var dist = fm.get(req.params.id.toLowerCase(), { maxChanges: 3 })
        if(dist.distance>threshold){
            image = fm.get(req.params.id.toLowerCase()).value
            console.log("value image ",image)
        }else{
            image = "other"
        }
        var file = 'category/'+image+'.png';
        //console.log("getting image");
        fs.readFile(file, function(err, content){
        //console.log("File -> ", file);
        if(err){
            console.log("file not found ",file);
            res.writeHead(404);
            res.end();
        }else{

            res.end(content);
        }
    })
    }catch(e) {
       res.status(500).json({message: e.message})
    }
 })

 module.exports = router