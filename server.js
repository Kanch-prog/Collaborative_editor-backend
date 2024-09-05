require('dotenv').config();

const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const socketIo = require('socket.io');

// Import models and routes
const Document = require('./models/Document');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/document');


const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS configuration
const io = socketIo(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    }
});

// Use CORS middleware for Express
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// Enable CORS for all routes
app.use(cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Add any other methods you need
    origin: 'http://localhost:3000' // Specify your frontend origin
}));
app.use(cors(corsOptions)); // Ensure this is applied before any routes
app.use(express.json()); // JSON body parser

// Define routes
app.use('/auth', authRoutes); // This will route /auth/* to the authRoutes
app.use('/document', documentRoutes);
app.use('/api', userRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err));

// Simple route
app.get('/', (req, res) => {
    res.send('Collaborative Editor API');
});

// Socket.IO setup
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join-document', (documentId, username) => {
        socket.join(documentId);
        io.to(documentId).emit('user-joined', username);
    });

    socket.on('document-change', async (data) => {
        const { documentId, content, username } = data;
    
        // Broadcast changes and the current editor
        socket.to(documentId).emit('document-update', { content, username });
    
        try {
            // Update the document in the database
            const updatedDocument = await Document.findByIdAndUpdate(documentId, { content }, { new: true });
            console.log('Document updated:', updatedDocument);
        } catch (err) {
            console.error('Error updating document:', err);
        }
    });
    
    socket.on('leave-document', (documentId, username) => {
        socket.leave(documentId);
        io.to(documentId).emit('user-left', username);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
