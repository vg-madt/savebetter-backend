const express = require('express');
const app = express();
const mongoose = require('mongoose');
require('dotenv').config()

mongoose.connect(process.env.DATABASE_URL, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to Database'))

app.use(express.json());

const receiptRouter = require('./routes/receipt');
const imageRouter = require('./routes/image')
const userRouter = require('./routes/users')
const productRouter = require('./routes/product')
const categoryRouter = require('./routes/category')

app.use('/receipt', receiptRouter)
app.use('/image', imageRouter)
app.use('/user',userRouter)
app.use('/product',productRouter)
app.use('/category',categoryRouter)

app.get('/', (req, res) => {
    res.send("app will work");
});

app.listen(3000,() => {
    console.log("server running on port 3000")
})