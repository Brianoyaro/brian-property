// server.js (Express + Socket.IO + Persistence)

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// MySQL Connection
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'rental_app'
};

let db;
(async () => {
    db = await mysql.createConnection(dbConfig);
    console.log("MySQL Connected");
})();

// --- REST API ---

// Get all conversations for a user
app.get('/conversations/:userId', async (req, res) => {
    const [rows] = await db.execute(`
        SELECT DISTINCT u.id, u.name, u.email FROM users u
        JOIN messages m ON (m.sender_id = u.id OR m.receiver_id = u.id)
        WHERE u.id != ?
    `, [req.params.userId]);

    res.json(rows);
});

// Get messages for conversation
app.get('/messages/:userId/:contactId', async (req, res) => {
    const { userId, contactId } = req.params;
    const [rows] = await db.execute(`
        SELECT * FROM messages
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at ASC
    `, [userId, contactId, contactId, userId]);

    res.json(rows);
});

// --- WebSocket ---
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join personal room
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
    });

    // Handle message sending
    socket.on('send_message', async (data) => {
        const { sender_id, receiver_id, message } = data;

        // Save to DB
        await db.execute(`
            INSERT INTO messages (sender_id, receiver_id, message, is_read)
            VALUES (?, ?, ?, 0)
        `, [sender_id, receiver_id, message]);

        // Emit to receiver room
        io.to(`user_${receiver_id}`).emit('receive_message', {
            sender_id,
            receiver_id,
            message,
            created_at: new Date()
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start Server
server.listen(5000, () => console.log('Server running on http://localhost:5000'));

