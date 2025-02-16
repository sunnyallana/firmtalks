import express from 'express';
import { Discussion } from '../models/discussion.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .populate('author', 'username reputation')
      .sort({ createdAt: -1 });
    res.json(discussions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    
    const discussion = new Discussion({
      title,
      content,
      author: req.user.userId,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await discussion.save();
    
    const populatedDiscussion = await discussion.populate('author', 'username reputation');
    res.status(201).json(populatedDiscussion);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('author', 'username reputation')
      .populate('replies.author', 'username reputation');
      
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    res.json(discussion);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/replies', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    discussion.replies.push({
      content,
      author: req.user.userId
    });
    
    await discussion.save();
    
    const updatedDiscussion = await discussion.populate('replies.author', 'username reputation');
    res.json(updatedDiscussion);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    const likeIndex = discussion.likes.indexOf(req.user.userId);
    
    if (likeIndex === -1) {
      discussion.likes.push(req.user.userId);
    } else {
      discussion.likes.splice(likeIndex, 1);
    }
    
    await discussion.save();
    res.json(discussion);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;