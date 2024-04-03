const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your_secret_key_here',
    resave: false,
    saveUninitialized: true
}));

mongoose.connect('mongodb+srv://nikhitha:nikhitha789@cluster0.9f7hpig.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
});

const userSchema = new mongoose.Schema({
    userName: String,
    mail: String,
    password: String,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Number, default: 0 }
});

const User = mongoose.model('user', userSchema);

app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.post('/signup', async (req, res) => {
    const { userName, email, password } = req.body;
    // Regular expression to check for strong password
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
        return res.status(400).send("Please make your password strong by adding special characters, numbers, and both lowercase and uppercase alphabets.");
    }
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
        req.session.user = user; // Store user data in session after successful signup
        res.render('signup_success.ejs'); // Render the signup success view
    } catch (error) {
        res.status(500).send("Error signing up. Please try again later.");
    }
});

app.post('/login', async (req, res) => {
    const { userName, password } = req.body;
    try {
        if (req.session.user) {
            return res.status(400).send("Another user is already logged in. Please log out before logging in again.");
        }
        const user = await User.findOne({ userName });
        if (user) {
            if (user.lockUntil && user.lockUntil > Date.now()) {
                return res.status(400).send(`Your account is locked. Please try again after ${Math.ceil((user.lockUntil - Date.now()) / 3600000)} hours.`);
            }
            if (user.loginAttempts >= 5 && (!user.lockUntil || user.lockUntil <= Date.now())) {
                user.loginAttempts = 0;
                user.lockUntil = Date.now() + 24 * 60 * 60 * 1000; // Lock the account for 24 hours
                await user.save();
                return res.status(400).send(`Your account is locked. Please try again after 24 hours.`);
            }
            if (user.password === password) {
                req.session.user = user; // Store user data in session after successful login
                user.loginAttempts = 0; // Reset login attempts
                await user.save();
                return res.send("Signed in successfully!"); // Signed in successfully
            } else {
                user.loginAttempts++;
                await user.save();
                return res.status(400).send("Enter the valid credentials!!"); // Incorrect username or password
            }
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
