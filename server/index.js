import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import { clerkMiddleware } from '@clerk/express'
import discussionRoutes from './routes/discussionRoutes.js';
import clerkWebhook from './routes/clerkWebhook.js';
import userRoutes from './routes/userRoutes.js';
import { Server } from 'socket.io';


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
app.set('io', io); 

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.use('/api/discussions', discussionRoutes);
app.use('/api/users', userRoutes);

app.use('/webhook', clerkWebhook);

  
const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});