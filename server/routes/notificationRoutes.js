import express from 'express';
import { Notification } from '../models/notificationModel.js';
import { User } from '../models/userModel.js'
import { requireAuth, getAuth } from '@clerk/express';

const router = express.Router();

// Get user notifications
router.get('/me/notifications', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const user = await User.findOne({ clerkId: userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const notifications = await Notification.find({ recipient: user._id })
      .sort({ createdAt: -1 })
      .populate('sender', 'username profileImageUrl')
      .populate('discussion', 'title')
      .populate('reply', 'content');

    res.set('Content-Type', 'application/json');
    res.json(notifications);
  } catch (error) {
    console.error('Notification fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark notifications as read
router.patch('/me/notifications/read', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const user = await User.findOne({ clerkId: userId });
    
    await Notification.updateMany(
      { recipient: user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: `Error updating notifications: ${error.message}` });
  }
});

export default router;