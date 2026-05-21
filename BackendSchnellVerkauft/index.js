'use strict'

import crypto from 'crypto';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';

const dbFilePath = path.join(process.cwd(), 'database.sqlite');
const PORT = 3000;
const app = express();
app.use(express.json());
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE']}
});



if (fs.existsSync(dbFilePath)) {
    fs.unlinkSync(dbFilePath);
}

const db = await open({
    filename: dbFilePath,
    driver: sqlite3.Database
});

await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        username    TEXT    NOT NULL,
        email       TEXT    NOT NULL UNIQUE,
        password    TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
        token      TEXT    PRIMARY KEY,
        user_id    INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
`);

app.get('/', (req, res) => {
    res.send('hello world');
});

function hashPassword(password) { // Gemini Prompt: "Create a js function to hash password"
    return crypto.createHash('sha256').update(password).digest('hex');
}

//middleware check Bearer Token
async function requireAuth(req, res, next) {
    const auth = req.headers.authorization;
    if (!(auth && auth.startsWith('Bearer '))) {
        return res.status(401).json({ error: 'not loged in' });
    }
    const token = auth.slice(7);
    const session = await db.get(`
        SELECT * FROM sessions WHERE token = ?
    `, [token]);
    if (!session) {
        return res.status(401).json({ error: 'wrong token' });
    }
    req.userId = session.user_id;
    next();
}

app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    console.log('email:' + email + " password: " + password)

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'wrong input' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'password needs to be 6 letters long' });
    }

    const existing = await db.get(`
        SELECT id FROM users WHERE email = ?
    `, [email]);
    if (existing) {
        return res.status(409).json({ error: 'e-mail already used' });
    }

    const pwdhash = hashPassword(password);
    const result = await db.run(`
        INSERT INTO users (username, email, password) VALUES (?, ?, ?)
    `, [username, email, pwdhash]);

    res.status(201).json({ message: 'succesfull', userId: result.lastID });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('email:' + email + " password: " + password)

    if (!email || !password) {
        return res.status(400).json({ error: 'wrong input' });
    }

    const user = await db.get(`
        SELECT * FROM users WHERE email = ? AND password = ?
    `, [email, hashPassword(password)]);

    if (!user) {
        return res.status(401).json({ error: 'email or password wrong' });
    }

    const token = crypto.randomUUID();
    await db.run(`
        INSERT INTO sessions (token, user_id) VALUES (?, ?)
    `, [token, user.id]);

    res.json({
        token,
        user: { id: user.id, username: user.username, email: user.email }
    });
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
    const token = req.headers.authorization.slice(7);
    await db.run(`
        DELETE FROM sessions WHERE token = ?
    `, [token]);
    res.json({ message: 'logout succesfull' });
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
    const user = await db.get(`
        SELECT id, username, email, created_at FROM users WHERE id = ?
    `, [req.userId]);
    if (!user) return res.status(404).json({ error: 'user not found' });
    res.json({ user });
});

io.on('connection', (socket) => {
    console.log(`new client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`client with id ${socket.id} has disconnected`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`backend server listening of port ${PORT}`);
});