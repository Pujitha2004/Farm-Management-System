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
    lockUntil: { type: Number, default: 0 },
    activeSessions: [String] // Store session IDs of active sessions
});

const User = mongoose.model('user', userSchema);

app.get('/', (req, res) => {
    res.render('index.ejs', { message: req.session.message });
});

app.post('/signup', async (req, res) => {
    const { userName, email, password } = req.body;
    // Regular expression to check for strong password
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) {
        req.session.message = "Please make your password strong by adding special characters, numbers, and both lowercase and uppercase alphabets.";
        return res.redirect('/');
    }
    try {
        const existingUserByEmail = await User.findOne({ mail: email });
        if (existingUserByEmail) {
            req.session.message = "Email already exists, please use a different email address";
            return res.redirect('/');
        }

        const existingUserByUsername = await User.findOne({ userName });
        if (existingUserByUsername) {
            req.session.message = "Username already exists, please choose a different username";
            return res.redirect('/');
        }

        const user = new User({ userName, mail: email, password });
        await user.save();
        req.session.user = user; // Store user data in session after successful signup
        req.session.message = "Signup successful!";
        return res.redirect('/');
    } catch (error) {
        req.session.message = "Error signing up. Please try again later.";
        return res.redirect('/');
    }
});

app.post('/login', async (req, res) => {
    const { userName, password } = req.body;
    try {
        const user = await User.findOne({ userName });

        if (user) {
            // Check if passwords match
            if (user.password !== password) {
                user.loginAttempts++;
                if (user.loginAttempts >= 5 && (!user.lockUntil || user.lockUntil <= Date.now())) {
                    user.lockUntil = Date.now() + 3600000; // Lock the account for 1 hour
                    req.session.message = "Due to multiple invalid login attempts, your account is locked. Please try again after 1 hour.";
                } else {
                    req.session.message = "Passwords do not match. Please try again.";
                }
                await user.save();
                return res.redirect('/');
            }

            if (user.activeSessions.includes(req.sessionID)) {
                req.session.message = "Another user is already logged in. Please log out before logging in again.";
                return res.redirect('/');
            }

            if (user.lockUntil && user.lockUntil > Date.now()) {
                req.session.message = `Your account is locked. Please try again after ${Math.ceil((user.lockUntil - Date.now()) / 3600000)} hour.`;
                return res.redirect('/');
            }

            user.activeSessions.push(req.sessionID); // Add session ID to activeSessions array
            req.session.user = user; // Store user data in session after successful login
            user.loginAttempts = 0; // Reset login attempts
            await user.save();
            req.session.message = "Signed in successfully!";
            return res.redirect('/');
        } else {
            req.session.message = "Please enter the valid credentials";
            return res.redirect('/');
        }
    } catch (error) {
        req.session.message = "Error signing in. Please try again later.";
        return res.redirect('/');
    }
});

app.set('view engine', 'ejs');

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
