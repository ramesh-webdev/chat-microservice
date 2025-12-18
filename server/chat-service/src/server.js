require('dotenv').config();
const express = require('express');
const http = require('http');
const {
    Server
} = require('socket.io');
const cors = require('cors');
const connectDB = require('../config/db');
const messageRoutes = require('./routes/message.routes');
const conversationRoutes = require('./routes/conversation.routes');
const socketHandlers = require('./sockets');


const app = express();
app.use(cors());
app.use(express.json());


// routes
app.use('/messages', messageRoutes);
app.use('/conversations', conversationRoutes);


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});


socketHandlers(io);


const PORT = process.env.PORT;
connectDB(process.env.MONGO_URI)
    .then(() => server.listen(PORT, () => console.log('Chat service running on', PORT)))
    .catch(err => console.error(err));