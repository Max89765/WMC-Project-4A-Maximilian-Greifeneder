'use strict'

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
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});


if (fs.existsSync(dbFilePath)) {
    fs.unlinkSync(dbFilePath);
}

const db = await open({
    filename: dbFilePath,
    driver: sqlite3.Database
});

app.get('/', (req, res) => {
    res.send('hello world');
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