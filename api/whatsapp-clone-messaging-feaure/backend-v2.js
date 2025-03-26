// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// -------------------- Database Setup --------------------

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'yourpassword',
    database: 'chat_db'
});

// -------------------- Create Tables if not exists --------------------
async function initDB() {
    await db.query(`
        CREATE TABLE IF NOT EXISTS conversations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255)
        )
    `);
    await db.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            conversation_id INT,
            sender VARCHAR(255),
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
        )
    `);
}
initDB();

// -------------------- WebSocket Logic --------------------

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join room (global for now)
    socket.on('join', () => {
        console.log('User joined:', socket.id);
    });

    // Get all conversations
    socket.on('get_conversations', async () => {
        const [rows] = await db.query('SELECT * FROM conversations');
        socket.emit('conversations', rows);
    });

    // Get all messages for a conversation
    socket.on('get_messages', async (conversationId) => {
        const [rows] = await db.query('SELECT * FROM messages WHERE conversation_id = ?', [conversationId]);
        socket.emit('messages', rows);
    });

    // Typing Indicator
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    });

    // Send a message
    socket.on('send_message', async (data) => {
        const { conversation_id, message } = data;
        await db.query('INSERT INTO messages (conversation_id, sender, message) VALUES (?, ?, ?)', [conversation_id, 'Other', message]);
        io.emit('receive_message', { conversation_id, sender: 'Other', message });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// -------------------- REST Example (optional) --------------------

app.post('/conversation', async (req, res) => {
    const { name } = req.body;
    const [result] = await db.query('INSERT INTO conversations (name) VALUES (?)', [name]);
    res.json({ id: result.insertId, name });
});

// -------------------- Start Server --------------------
server.listen(5000, () => {
    console.log('Server running on http://localhost:5000');
});

