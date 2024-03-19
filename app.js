const express = require('express');
const mongoose = require('mongoose');

const multer = require('multer');
const app = express();
const request = require('request');
const axios = require('axios');
const fs = require('fs');
const port = 3000;

app.use(express.urlencoded({ extended: true }));

mongoose.connect('mongodb+srv://nikhitha:nikhitha789@cluster0.9f7hpig.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
});

const userSchema = new mongoose.Schema({
    userName: String,
    mail: String,
    password: String,
});

const User = mongoose.model('user', userSchema)

app.get('/', (req, res) => {
    res.render('index.ejs');
})

app.post('/signup', async (req, res) => {
    const { userName, email, password } = req.body;
    const existingUser = await User.findOne({
        userName,
    });

    if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
    }

    const user = new User({
        userName: userName,
        mail: email,
        password: password,
    });

    await user.save();

    // Render signup success message
    res.render('signup_success', { userName });
});

app.post('/login', async (req, res) => {
    const { userName, password } = req.body;
    const user = await User.findOne({ userName });

    if (user) {
        if (password === user.password) {
            res.redirect('/login')
        } else {
            res.redirect('/')
        }
    }
    else {
        res.render('login.ejs')
    }
});

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
