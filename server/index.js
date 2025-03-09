import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './db.js';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { clerkMiddleware } from '@clerk/express';
import discussionRoutes from './routes/discussionRoutes.js';
import clerkWebhook from './routes/clerkWebhook.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { Server } from 'socket.io';
import { User } from './models/userModel.js'

dotenv.config();
connectDB();

const app = express();

app.use(clerkMiddleware());
app.use(express.json());
app.use(cors());

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true
  }
});

io.userSockets = new Map();

io.on('connection', async (socket) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) throw new Error('Authentication token missing');

    // Verify Clerk token
    const decodedToken = await clerkClient.verifyToken(token);
    const clerkUserId = decodedToken.sub;

    // Find or create user in database
    let user = await User.findOne({ clerkId: clerkUserId });
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(clerkUserId);
      user = await User.create({
        clerkId: clerkUserId,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        username: clerkUser.username || `${clerkUser.firstName}${clerkUser.lastName}` || `user${Date.now()}`,
        profileImageUrl: clerkUser.imageUrl
      });
    }

    // Track socket ID with user's database _id
    const userDbId = user._id.toString();
    if (!io.userSockets.has(userDbId)) {
      io.userSockets.set(userDbId, new Set());
    }
    io.userSockets.get(userDbId).add(socket.id);

    // Remove socket on disconnect
    socket.on('disconnect', () => {
      if (io.userSockets.has(userDbId)) {
        io.userSockets.get(userDbId).delete(socket.id);
        if (io.userSockets.get(userDbId).size === 0) {
          io.userSockets.delete(userDbId);
        }
      }
    });

  } catch (error) {
    console.error('Socket connection error:', error.message);
    socket.disconnect();
  }
});

app.set('io', io);

// Routes
app.use('/api/discussions', discussionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/webhook', clerkWebhook);

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});