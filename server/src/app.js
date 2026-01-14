
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

import connectDB from './config/db.js';
import { redis } from './config/redis.js'; // Ensure redis connects
import routes from './routes/index.routes.js';
import socketService from './services/socket.service.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static Uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Socket.io
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

// Socket.io injection
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use('/', routes);

// Pass redis adapter if scaling, but for now single instance is fine.
// If multi-instance needed later, add @socket.io/redis-adapter
socketService(io);

// Database & Server Start
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Unified Server running on port ${PORT}`);
    });
});
