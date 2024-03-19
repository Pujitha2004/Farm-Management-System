const express = require('express');
const mongoose = require('mongoose');

// const cloudinary = require('cloudinary').v2;

const multer = require('multer');
const app = express();
const request = require('request');
const axios = require('axios');
const fs = require('fs');
const port = 3000;

app.use(express.urlencoded({ extended: true }));

// cloudinary.config({
//     cloud_name: '',
//     api_key: '',
//     api_secret: '',
//     secure: true,
// });

let password = 'quexa';
let user = 'quexavit:';
mongoose.connect('mongodb+srv://' + user + password + '@cluster0.b59pavi.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
});

const userSchema = new mongoose.Schema({
    userName: String,
    mail:String,
    password: String,
});

const User = mongoose.model('user', userSchema)


app.get('/', (req, res) => {
    res.render('index.ejs');
})

app.post('/login', async (req, res) => {
    const { userName, password } = req.body;
    const user = await User.findOne({ userName });

    if (user) {
        if (password === user.password) {
            const posts = await Post.find({ verified: 0 }).select('courseCode examDate slot examType paperId');
            authenticated = true;
            res.render('verify.ejs', { posts });
        } else {
            res.render('login.ejs')
        }
    }
    else {
        res.render('login.ejs')
    }}
);

app.use(express.static('public'));
app.set('view engine', 'ejs');


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});