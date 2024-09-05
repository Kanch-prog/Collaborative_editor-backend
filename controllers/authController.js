const jwt = require('jsonwebtoken');

// Token generation utility functions
const generateToken = (userId) => {
    return jwt.sign({ userId: userId }, process.env.JWT_SECRET, { expiresIn: '15m' }); // Shorter lifespan for access token
};

const generateRefreshToken = (userId) => {
    return jwt.sign({ userId: userId }, process.env.JWT_SECRET, { expiresIn: '7d' }); // Longer lifespan for refresh token
};

module.exports = {
    generateToken,
    generateRefreshToken
};