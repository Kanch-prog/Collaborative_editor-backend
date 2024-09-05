const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Token verification middleware
const verifyToken = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        // Verify the token and decode it
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Decoded Token:', decoded); // Log the decoded token

        // Find the user by ID extracted from the token
        const user = await User.findById(decoded.userId);
        if (!user) {
            console.log('User not found with ID:', decoded.userId); // Log if user is not found
            return res.status(401).json({ message: 'User not found.' });
        }

        // Attach the user object to the request
        req.user = user;
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message); // Log error details
        res.status(401).json({ message: 'Invalid token.' });
    }
};

module.exports = verifyToken;