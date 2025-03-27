// Basic Express + Socket.IO + MySQL Chat Backend
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// DB Connection
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // your password
    database: 'real_estate'
});

// Get current user (simulate authentication)
app.get('/api/me', async (req, res) => {
    // Dummy authenticated user
    const user = { id: 1, name: 'John Doe', email: 'john@example.com' };
    res.json(user);
});

// Get all conversations for current user
app.get('/api/conversations', async (req, res) => {
    const [rows] = await db.query(`
        SELECT c.*, 
               buyer.id AS buyer_id, buyer.name AS buyer_name, buyer.email AS buyer_email,
               seller.id AS seller_id, seller.name AS seller_name, seller.email AS seller_email
        FROM conversations c
        JOIN users buyer ON c.buyer_id = buyer.id
        JOIN users seller ON c.seller_id = seller.id
        WHERE buyer_id = ? OR seller_id = ?`, [1, 1]); // replace 1 with req.user.id
    res.json(rows.map(row => ({
        id: row.id,
        buyer: { id: row.buyer_id, name: row.buyer_name, email: row.buyer_email },
        seller: { id: row.seller_id, name: row.seller_name, email: row.seller_email }
    })));
});

// Get messages of a conversation
app.get('/api/messages/:conversationId', async (req, res) => {
    const { conversationId } = req.params;
    const [rows] = await db.query(`SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC`, [conversationId]);
    res.json(rows);
});

// Create conversation (only if doesn't exist) 
app.post('/api/conversations', async (req, res) => {
    const { buyer_id, seller_id } = req.body;
    const [existing] = await db.query(`SELECT * FROM conversations WHERE buyer_id = ? AND seller_id = ?`, [buyer_id, seller_id]);
    if (existing.length > 0) return res.json(existing[0]);
    const [result] = await db.query(`INSERT INTO conversations (buyer_id, seller_id) VALUES (?, ?)`, [buyer_id, seller_id]);
    const [newConv] = await db.query(`SELECT * FROM conversations WHERE id = ?`, [result.insertId]);
    res.json(newConv[0]);
});

// -----------------------
// Real-time chat section
// -----------------------

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a specific conversation room
    socket.on('join_conversation', (conversationId) => {
        socket.join(`conversation_${conversationId}`);
    });

    // Handle sending a message
    socket.on('send_message', async (msg) => {
        const { conversation_id, sender_id, message } = msg;

        // Store the message
        await db.query(`INSERT INTO messages (conversation_id, sender_id, message, status) VALUES (?, ?, ?, ?)`, [
            conversation_id,
            sender_id,
            message,
            'delivered'
        ]);

        // Emit to all in room except sender
        socket.to(`conversation_${conversation_id}`).emit('receive_message', {
            ...msg,
            status: 'delivered'
        });

        // Optional: Sender sees their own message with delivered status
        socket.emit('receive_message', { ...msg, status: 'delivered' });
    });

    // Mark messages as seen
    socket.on('mark_seen', async ({ conversation_id, user_id }) => {
        await db.query(`UPDATE messages SET status = 'seen' WHERE conversation_id = ? AND sender_id != ?`, [conversation_id, user_id]);
        io.in(`conversation_${conversation_id}`).emit('messages_seen', { conversation_id });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Start server
server.listen(5000, () => console.log('Server running on http://localhost:5000'));

