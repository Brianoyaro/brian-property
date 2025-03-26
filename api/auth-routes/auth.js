const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const connection = require('../config/database');

const router = express.Router();

router.post('/register', async (req, res) => {
    const { username, email, role, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    await connection.query('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, role], (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(201).send('User Registered');
        }
    });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    await connection.query('SELECT * FROM users WHERE email = ?', [email], async (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
            return;
        }
        if (results.length > 0) {
            const user = results[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                const token = jwt.sign({ id: user.id }, 'secret', { expiresIn: '1h' });
                res.status(200).json({ token });
            } else {
                res.status(401).send('Invalid Credentials');
                return;
            }
        } else {
            res.status(401).send('Invalid Credentials');
        }
    })
});


router.get('/profile', async (req, res) => {
    await connection.query('SELECT * FROM users WHERE id=?', [id], async (error, results) => {
        if (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
            return;
        }
        res.status(200).json(results);
    })
});
module.exports = router;