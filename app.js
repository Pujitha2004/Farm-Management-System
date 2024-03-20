const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb+srv://nikhitha:nikhitha789@cluster0.9f7hpig.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
});

const userSchema = new mongoose.Schema({
    userName: String,
    mail: String,
    password: String,
});

const User = mongoose.model('user', userSchema);

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.post('/signup', async (req, res) => {
    const { userName, email, password } = req.body;
    try {
        const existingUserByEmail = await User.findOne({ mail: email });
        if (existingUserByEmail) {
            return res.status(400).json({ error: "Email already exists, please use a different email address" });
        }

        const existingUserByUsername = await User.findOne({ userName });
        if (existingUserByUsername) {
            return res.status(400).json({ error: "Username already exists, please choose a different username" });
        }

        const user = new User({ userName, mail: email, password });
        await user.save();
        res.render('signup_success.ejs'); // Render the signup success view
    } catch (error) {
        res.status(500).send("Error signing up. Please try again later.");
    }
});

app.post('/login', async (req, res) => {
    const { userName, password } = req.body;
    try {
        const user = await User.findOne({ userName });
        if (user && user.password === password) {
            res.send("Signed in successfully!"); // Signed in successfully
        } else {
            res.status(400).send("Enter the valid credentials!!"); // Incorrect username or password
        }
    } catch (error) {
        res.status(500).send("Error signing in. Please try again later.");
    }
});

app.set('view engine', 'ejs');

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
