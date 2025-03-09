import express from 'express';
import { User } from '../models/userModel.js';
import { Bookmark } from '../models/bookmarkModel.js';
import { Notification } from '../models/notificationModel.js'
import { clerkClient, requireAuth, getAuth } from '@clerk/express';

const router = express.Router();

// Get user stats by clerkId
router.get('/:clerkId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId })
      .select('-email -__v -_id');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const stats = {
      username: user.username,
      profileImageUrl: user.profileImageUrl,
      joined: user.createdAt,
      lastActive: user.lastActive,
      reputation: user.reputation,
      totalDiscussions: user.totalDiscussions,
      totalLikes: user.totalLikes,
      totalReplies: user.totalReplies,
      totalMalwareScans: user.totalMalwareScans,
      unreadNotifications: await Notification.countDocuments({ 
        recipient: user._id,
        read: false 
      })
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: `Error fetching user stats: ${error.message}` });
  }
});

// Get current user by clerkId
async function getCurrentUser(userId) {
  let user = await User.findOne({ clerkId: userId });
  if (!user) {
    const clerkUser = await clerkClient.users.getUser(userId);
    user = await User.create({
      clerkId: userId,
      email: clerkUser.emailAddresses[0].emailAddress,
      username: clerkUser.username || clerkUser.firstName + clerkUser.lastName || 'user' + Date.now(),
      profileImageUrl: clerkUser.imageUrl
    });
  }
  return user;
}

// Get all bookmarks for user
router.get('/me/bookmarks', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const user = await getCurrentUser(userId);
    
    const bookmarks = await Bookmark.find({ user: user._id })
      .populate({
        path: 'discussion',
        populate: {
          path: 'author',
          select: 'username profileImageUrl'
        }
      })
      .sort({ createdAt: -1 });

    res.json(bookmarks);
  } catch (error) {
    res.status(500).json({ message: `Error fetching bookmarks: ${error.message}` });
  }
});

// Post or delete bookmark for user
router.put('/me/bookmarks/:discussionId', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { discussionId } = req.params;
    const user = await getCurrentUser(userId);

    // Check for existing bookmark
    const existingBookmark = await Bookmark.findOne({
      user: user._id,
      discussion: discussionId
    });

    let action = '';
    let result = null;
    const io = req.app.get('io');

    if (existingBookmark) {
      // Remove bookmark
      await Bookmark.findByIdAndDelete(existingBookmark._id);
      action = 'removed';

      // io.emit('bookmark-removed', { userId: user._id, discussionId });
    
      const userSockets = io.userSockets.get(user._id.toString());
      if (userSockets) {
        userSockets.forEach(socketId => {
          io.to(socketId).emit('bookmark-removed', { discussionId });
      });}

    } else {
      // Add new bookmark
      const newBookmark = new Bookmark({
        user: user._id,
        discussion: discussionId
      });
      result = await newBookmark.save();
      action = 'added';

      // io.emit('bookmark-added', { userId: user._id, discussionId });
      const userSockets = io.userSockets.get(user._id.toString());
      if (userSockets) {
        userSockets.forEach(socketId => {
          io.to(socketId).emit('bookmark-added', { discussionId });
        });
      }
    }

    res.json({
      action,
      bookmarked: !existingBookmark,
      bookmark: result
    });

  } catch (error) {
    res.status(500).json({ 
      message: `Error toggling bookmark: ${error.message}`,
      code: error.code
    });
  }
});

export default router;