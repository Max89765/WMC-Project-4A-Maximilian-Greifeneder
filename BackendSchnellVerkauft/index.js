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


io.on('connection', (socket) => {
    console.log(`new client connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`client with id ${socket.id} has disconnected`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`backend server listening of port ${PORT}`);
});