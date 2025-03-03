import express from 'express';
import { User } from '../models/userModel.js';

const router = express.Router();

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

export default router;