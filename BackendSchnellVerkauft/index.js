'use strict'

import crypto from 'crypto';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import cors from 'cors';
import multer from 'multer'; //help with ai

const dbFilePath = path.join(process.cwd(), 'database.sqlite');
const PORT = 3000;
const app = express();
app.use(cors());
app.use(express.json());
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE']}
});

// ── Multer – Bild-Upload Konfiguration ────────────────────────────────────────
// Claude Prompt: "How do I configure multer in express to save uploaded images to a folder?"
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, crypto.randomUUID() + ext);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // max 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        cb(null, allowed.includes(file.mimetype));
    }
});

// Uploads-Ordner als statische Dateien bereitstellen
app.use('/uploads', express.static('./uploads'));


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

    CREATE TABLE IF NOT EXISTS listings (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        title       TEXT    NOT NULL,
        description TEXT    NOT NULL,
        price       REAL    NOT NULL,
        category    TEXT    NOT NULL,
        location    TEXT    NOT NULL,
        user_id     INTEGER NOT NULL,
        created_at  TEXT    DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS images (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        listing_id  INTEGER NOT NULL,
        url         TEXT    NOT NULL,
        FOREIGN KEY (listing_id) REFERENCES listings(id)
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

app.get('/api/listings', async (req, res) => {// help with ai
    const { q, category, location } = req.query;

    let query = `
        SELECT listings.*, users.username,
               (SELECT url FROM images WHERE listing_id = listings.id LIMIT 1) AS image
        FROM listings
        JOIN users ON listings.user_id = users.id
        WHERE 1=1
    `;
    const params = [];

    if (q) {
        query += ' AND (listings.title LIKE ? OR listings.description LIKE ?)';
        params.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
        query += ' AND listings.category = ?';
        params.push(category);
    }
    if (location) {
        query += ' AND listings.location LIKE ?';
        params.push(`%${location}%`);
    }

    query += ' ORDER BY listings.created_at DESC';

    const listings = await db.all(query, params);
    res.json(listings);
});

app.get('/api/listings/:id', async (req, res) => {
    const listing = await db.get(`
        SELECT listings.*, users.username
        FROM listings
        JOIN users ON listings.user_id = users.id
        WHERE listings.id = ?
    `, [req.params.id]);

    if (!listing) return res.status(404).json({ error: 'listing not found' });

    const images = await db.all(`
        SELECT url FROM images WHERE listing_id = ?
    `, [req.params.id]);

    res.json({ ...listing, images: images.map(i => i.url) });
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