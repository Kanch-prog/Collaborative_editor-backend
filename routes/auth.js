const express = require('express');
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const User = require('../models/User');
const { generateToken, generateRefreshToken } = require('../controllers/authController');

const router = express.Router();

const refreshTokens = {}; // Object to store valid refresh tokens
const storedTokens = {}; // Object to store valid access tokens

// Register
const register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const hashedPassword = await argon2.hash(password.trim());

        const user = new User({
            username,
            email,
            password: hashedPassword,
        });

        await user.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await argon2.verify(user.password, password.trim());
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);
        const refreshToken = generateRefreshToken(user._id);
        
        // Store tokens
        storedTokens[user._id] = token;
        refreshTokens[refreshToken] = user._id;

        res.status(200).json({ token, refreshToken, userId: user._id });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Refresh Token
const refreshToken = async (req, res) => {
    const { token } = req.body;

    if (!token || !refreshTokens[token]) {
        return res.status(403).json({ message: 'Refresh token is not valid' });
    }

    try {
        const userId = refreshTokens[token];
        const newToken = generateToken(userId);

        // Update stored access token
        storedTokens[userId] = newToken;

        res.status(200).json({ token: newToken });
    } catch (error) {
        console.error('Refresh token error', error);
        res.status(403).json({ message: 'Invalid refresh token' });
    }
};

// Logout
const logout = (req, res) => {
    const { token } = req.body;
    console.log('Received token:', token);

    if (refreshTokens[token]) {
        const userId = refreshTokens[token];
        delete storedTokens[userId]; // Remove associated access token
        delete refreshTokens[token];  // Remove refresh token
        console.log('Token deleted successfully');
        return res.status(200).json({ message: 'Logged out successfully' });
    }

    console.log('Invalid token provided');
    res.status(400).json({ message: 'Invalid token' });
};

// Routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

module.exports = router;
