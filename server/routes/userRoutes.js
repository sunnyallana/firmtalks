import express from 'express';
import { User } from '../models/userModel.js';
import { Bookmark } from '../models/bookmarkModel.js';
import { requireAuth, getAuth } from '../middleware/authMiddleware.js';


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
      totalMalwareScans: user.totalMalwareScans
    };


    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: `Error fetching user stats: ${error.message}` });
  }
});

// Get all bookmarks for user
router.get('/me/bookmarks', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const user = await User.findOne({ clerkId: userId });
    
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

// Add bookmark
router.post('/me/bookmarks/:discussionId', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { discussionId } = req.params;
    const user = await User.findOne({ clerkId: userId });

    const existingBookmark = await Bookmark.findOne({
      user: user._id,
      discussion: discussionId
    });

    if (existingBookmark) {
      return res.status(400).json({ message: 'Discussion already bookmarked' });
    }

    const bookmark = new Bookmark({
      user: user._id,
      discussion: discussionId
    });

    await bookmark.save();
    res.status(201).json(bookmark);
  } catch (error) {
    res.status(500).json({ message: `Error creating bookmark: ${error.message}` });
  }
});

// Remove bookmark
router.delete('/me/bookmarks/:discussionId', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { discussionId } = req.params;
    const user = await User.findOne({ clerkId: userId });

    const bookmark = await Bookmark.findOneAndDelete({
      user: user._id,
      discussion: discussionId
    });

    if (!bookmark) {
      return res.status(404).json({ message: 'Bookmark not found' });
    }

    res.json({ message: 'Bookmark removed successfully' });
  } catch (error) {
    res.status(500).json({ message: `Error removing bookmark: ${error.message}` });
  }
});

export default router;