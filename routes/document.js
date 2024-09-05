const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const Document = require('../models/Document');
const User = require('../models/User'); // Assuming User model is defined

// Create a new document
router.post('/', verifyToken, async (req, res) => {
    const { title, content, collaborators, owner } = req.body;

    console.log('Received owner ID:', owner);
    console.log('Received collaborators before saving:', collaborators);

    try {
        const newDocument = new Document({ title, content, owner, collaborators });
        await newDocument.save();
        console.log('Document saved:', newDocument);
        res.status(201).json(newDocument);
    } catch (err) {
        console.error('Error saving document:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Get all documents for the user
router.get('/', verifyToken, async (req, res) => {
    try {
        const documents = await Document.find({
            $or: [
                { owner: req.user._id },
                { 'collaborators.user': req.user._id }
            ]
        }).populate('collaborators.user', 'username email');
        
        res.status(200).json(documents);
    } catch (err) {
        console.error('Error fetching documents:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a specific document by ID
router.put('/:id', verifyToken, async (req, res) => {
    console.log('Update request received for ID:', req.params.id);

    try {
        // Find the document
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Check permissions
        if (document.owner.toString() !== req.user._id.toString() && 
            !document.collaborators.some(collab => collab.user.toString() === req.user._id.toString() && collab.role !== 'viewer')) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Update document details
        document.title = req.body.title || document.title; // Update only if provided
        document.content = req.body.content || document.content; // Update only if provided
        if (req.body.collaborators) {
            document.collaborators = req.body.collaborators; // Only update if collaborators are provided
        }
        
        await document.save();

        res.status(200).json(document);
    } catch (err) {
        console.error('Error updating document:', err);
        res.status(500).json({ message: 'Server error.' });
    }
});

router.put('/:id', verifyToken, async (req, res) => {
    console.log('Update request received for ID:', req.params.id);

    try {
        // Find the document
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Check permissions
        if (document.owner.toString() !== req.user._id.toString() && 
            !document.collaborators.some(collab => collab.user.toString() === req.user._id.toString() && (collab.role === 'editor' || collab.role === 'owner'))) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Update document details
        document.title = req.body.title || document.title; // Update only if provided
        document.content = req.body.content || document.content; // Update only if provided
        if (req.body.collaborators) {
            document.collaborators = req.body.collaborators; // Only update if collaborators are provided
        }
        
        await document.save();

        res.status(200).json(document);
    } catch (err) {
        console.error('Error updating document:', err);
        res.status(500).json({ message: 'Server error.', error: err.message });
    }
});


// Add a collaborator by username
router.post('/:id/collaborators', verifyToken, async (req, res) => {
    const { role, username } = req.body;
    const { id } = req.params;

    try {
        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (document.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not the owner of this document' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isCollaborator = document.collaborators.some(collab => collab.user.toString() === user._id.toString());
        if (isCollaborator) {
            return res.status(400).json({ message: 'User is already a collaborator' });
        }

        document.collaborators.push({ user: user._id, role });
        await document.save();

        res.status(200).json({ message: 'Collaborator added' });
    } catch (err) {
        console.error('Error adding collaborator:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get collaborators for a document
router.get('/:id/collaborators', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const document = await Document.findById(id).populate('collaborators.user', 'username email');
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        res.status(200).json(document.collaborators);
    } catch (err) {
        console.error('Error fetching collaborators:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a document
router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const document = await Document.findById(id);

        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (document.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not the owner of this document' });
        }

        await document.remove();
        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (err) {
        console.error('Error deleting document:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
