import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { socketHandler } from './socket/handler.js';
import connectDB from './db.js';
import authRoutes from './routes/authRoutes.js';
import discussionRoutes from './routes/discussionRoutes.js';
import passport from 'passport';

dotenv.config();

connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(passport.initialize());


app.use('/api/auth', authRoutes);
app.use('/api/discussions', discussionRoutes);

socketHandler(io);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});