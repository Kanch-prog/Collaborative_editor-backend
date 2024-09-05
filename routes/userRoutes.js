const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const User = require('../models/User');

// Get all users without authentication
router.get('/users', async (req, res) => {
    try {
        const users = await User.find({}, 'username email');
        res.status(200).json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
