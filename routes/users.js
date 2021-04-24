const express = require('express')
const router = express.Router()
const User = require('../schema/user');
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

router.get('/all',async (req,res) => {
    try{
       let users = await User.find()
       users.forEach(user => user.password = "")
       res.json(users)
    }catch(e){
        console.log("Error retrieving users ",e)
    }
})


router.post('/register', (req, res) =>{
    let user;
    try{
        bcrypt.hash(req.body.password, 10, function(err, hashedPass) {
            if(err){
                res.json({error: err})
            }
            user = new User({
                username: req.body.username,
                email: req.body.email,
                password: hashedPass
            })
            user.save()
        })
        
        
        res.status(201).json({message: "user added"})
    }catch(e){
       res.status(400).json({message: e.message})
    }
})

router.post('/login', async (req, res, next) => {
    
    try{
        var email = req.body.email
        var password = req.body.password
        console.log("email, password",email,password);
        await User.find({email:req.body.email})
        .then(user => {
            console.log("user ",user)
            if(user){
                bcrypt.compare(password, user[0].password, function(err, result){
                    console.log("passwords ",password, user.password)
                    if(result){
                        res.json({
                            message:'Login Success',
                            email:user[0].email
                        })
                    }else if(err){
                        res.json({error: err})
                    }else{
                        res.json({message: 'invalid password'})
                    }
                })
            }
        })
        
    }catch(e){
        res.status(400).json({message: e.message})
        //console.log(e)
    }
})


 module.exports = router