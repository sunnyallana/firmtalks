import express from 'express';
import { Discussion } from '../models/discussionModel.js';
import { Reply } from '../models/replyModel.js';
import { Like } from '../models/likeModel.js';
import { User } from '../models/userModel.js';
import { clerkClient, requireAuth, getAuth } from '@clerk/express';

const router = express.Router();

// Get all discussions - public route
router.get('/', async (req, res) => {
  try {
    const sortType = req.query.sort || 'recent';
    
    // Get all discussions with their authors
    const discussions = await Discussion.find()
      .populate('author', 'username email clerkId profileImageUrl');
    
    // Get like counts for all discussions
    const discussionIds = discussions.map(d => d._id);
    const likeCounts = await Like.aggregate([
      { $match: { targetModel: 'Discussion', target: { $in: discussionIds } } },
      { $group: { _id: '$target', count: { $sum: 1 } } }
    ]);
    
    // Create a map of discussion ID to like count
    const likeCountMap = likeCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
    
    // Get replies count for each discussion
    const repliesCounts = await Reply.aggregate([
      { $match: { discussion: { $in: discussionIds } } },
      { $group: { _id: '$discussion', count: { $sum: 1 } } }
    ]);
    
    // Create a map of discussion ID to replies count
    const repliesCountMap = repliesCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
    
    // Populate the discussions with like counts and replies counts
    const populatedDiscussions = discussions.map(discussion => ({
      ...discussion.toObject(),
      likesCount: likeCountMap[discussion._id] || 0,
      repliesCount: repliesCountMap[discussion._id] || 0
    }));
    
    // Sort the discussions based on the requested sort type
    if (sortType === 'recent') {
      populatedDiscussions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortType === 'likes') {
      populatedDiscussions.sort((a, b) => b.likesCount - a.likesCount);
    }
    
    res.json({ discussions: populatedDiscussions });
  } catch (error) {
    res.status(500).json({ message: `Error fetching discussions: ${error.message}` });
  }
});

// Get single discussion with replies - public route
router.get('/:id', async (req, res) => {
  try {
    const replySort = req.query.replySort || 'recent';
    
    // Get the discussion with its author
    const discussion = await Discussion.findById(req.params.id)
      .populate('author', 'username email clerkId profileImageUrl');
      
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    // Get replies for this discussion
    const replies = await Reply.find({ discussion: req.params.id })
      .populate('author', 'username email clerkId profileImageUrl');
      
    // Get like counts for discussion and replies
    const targetIds = [discussion._id, ...replies.map(r => r._id)];
    const likes = await Like.find({
      target: { $in: targetIds }
    });
    
    // Create maps for like counts
    const likeCountMap = likes.reduce((acc, like) => {
      acc[like.target] = (acc[like.target] || 0) + 1;
      return acc;
    }, {});
    
    // Map and sort replies based on the specified sort type
    const populatedReplies = replies.map(reply => ({
      ...reply.toObject(),
      likesCount: likeCountMap[reply._id] || 0
    }));
    
    if (replySort === 'recent') {
      populatedReplies.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (replySort === 'likes') {
      populatedReplies.sort((a, b) => b.likesCount - a.likesCount);
    }
    
    // Create the final response object
    const populatedDiscussion = {
      ...discussion.toObject(),
      likesCount: likeCountMap[discussion._id] || 0,
      repliesCount: replies.length,
      replies: populatedReplies
    };
    
    res.json(populatedDiscussion);
  } catch (error) {
    res.status(500).json({ message: `Error fetching discussion: ${error.message}` });
  }
});

// Create a new discussion - protected route
router.post('/', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { title, content, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    // Get or create user
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      user = await User.create({
        clerkId: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        username: clerkUser.username || clerkUser.firstName,
        profileImageUrl: clerkUser.imageUrl
      });
    }

    const discussion = new Discussion({
      title,
      content,
      author: user._id,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });

    await discussion.save();

    const populatedDiscussion = {
      ...discussion.toObject(),
      author: {
        id: userId,
        clerkId: userId,
        username: user.username,
        email: user.email,
        profileImageUrl: user.profileImageUrl
      },
      likesCount: 0,
      repliesCount: 0
    };

    const io = req.app.get('io');
    io.emit('new-discussion', populatedDiscussion);

    res.status(201).json(populatedDiscussion);
  } catch (error) {
    res.status(500).json({ message: `Error creating discussion: ${error.message}` });
  }
});

// Like/unlike a discussion or reply - protected route
router.post('/:targetType/:id/like', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { targetType, id } = req.params;

    // Validate target type
    if (!['discussions', 'replies'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid target type' });
    }

    // Get or create user
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      user = await User.create({
        clerkId: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        username: clerkUser.username || clerkUser.firstName,
        profileImageUrl: clerkUser.imageUrl
      });
    }

    const targetModel = targetType === 'discussions' ? 'Discussion' : 'Reply';
    const Target = targetType === 'discussions' ? Discussion : Reply;

    const target = await Target.findById(id);
    if (!target) {
      return res.status(404).json({ message: `${targetModel} not found` });
    }

    // Check if like exists
    const existingLike = await Like.findOne({
      user: user._id,
      target: id,
      targetModel
    });

    if (existingLike) {
      // Unlike
      await Like.deleteOne({ _id: existingLike._id });
      target.likesCount = Math.max(0, target.likesCount - 1);
      user.totalLikes = Math.max(0, user.totalLikes - 1);
    } else {
      // Like
      await Like.create({
        user: user._id,
        target: id,
        targetModel
      });
      target.likesCount += 1;
      user.totalLikes += 1;
    }

    await target.save();
    await user.save();

    const io = req.app.get('io');
    io.emit('like-update', {
      targetModel,
      targetId: id,
      discussionId: target.discussion,
      likesCount: target.likesCount,
      userId: user._id.toString(),
      action: existingLike ? 'unlike' : 'like'
    });


    res.json({ 
      likesCount: target.likesCount,
      liked: !existingLike 
    });
  } catch (error) {
    res.status(500).json({ message: `Error toggling like: ${error.message}` });
  }
});

// Update discussion - protected route
router.put('/:id', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { title, content, tags } = req.body;
    
    // Get user
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Check if user is the author
    if (discussion.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this discussion' });
    }

    // Validate minimum lengths
    if (title && title.length < 10) {
      return res.status(400).json({ message: 'Title must be at least 10 characters long' });
    }
    if (content && content.length < 30) {
      return res.status(400).json({ message: 'Content must be at least 30 characters long' });
    }

    discussion.title = title || discussion.title;
    discussion.content = content || discussion.content;
    discussion.tags = tags ? tags.split(',').map(tag => tag.trim()) : discussion.tags;
    discussion.updatedAt = new Date();

    await discussion.save();

    const populatedDiscussion = await Discussion.findById(discussion._id)
      .populate('author', 'username email clerkId profileImageUrl');

    const io = req.app.get('io');
    io.emit('update-discussion', populatedDiscussion);

    res.json(populatedDiscussion);
  } catch (error) {
    res.status(500).json({ message: `Error updating discussion: ${error.message}` });
  }
});

// Delete discussion - protected route
router.delete('/:id', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const user = await User.findOne({ clerkId: userId });
    const discussion = await Discussion.findById(req.params.id);

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    if (discussion.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this discussion' });
    }

    // Delete associated replies and likes
    await Reply.deleteMany({ discussion: discussion._id });
    await Like.deleteMany({ 
      $or: [
        { target: discussion._id, targetModel: 'Discussion' },
        { target: { $in: await Reply.find({ discussion: discussion._id }).distinct('_id') }, targetModel: 'Reply' }
      ]
    });

    await Discussion.findByIdAndDelete(req.params.id);
    
    const io = req.app.get('io');
    io.emit('delete-discussion', req.params.id);
    
    res.json({ message: 'Discussion and associated content deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: `Error deleting discussion: ${error.message}` });
  }
});

// Get discussions by tag - public route
router.get('/tags/:tag', async (req, res) => {
  try {
    const tag = req.params.tag.toLowerCase();
    const sortType = req.query.sort || 'recent';
    
    // Get discussions with the specified tag
    const discussions = await Discussion.find({ tags: tag })
      .populate('author', 'username email clerkId profileImageUrl');
      
    // Get like counts
    const discussionIds = discussions.map(d => d._id);
    const likeCounts = await Like.aggregate([
      { $match: { targetModel: 'Discussion', target: { $in: discussionIds } } },
      { $group: { _id: '$target', count: { $sum: 1 } } }
    ]);
    
    // Create a map of discussion ID to like count
    const likeCountMap = likeCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
    
    // Get replies count for each discussion
    const repliesCounts = await Reply.aggregate([
      { $match: { discussion: { $in: discussionIds } } },
      { $group: { _id: '$discussion', count: { $sum: 1 } } }
    ]);
    
    // Create a map of discussion ID to replies count
    const repliesCountMap = repliesCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
    
    // Populate the discussions with like counts and replies counts
    const populatedDiscussions = discussions.map(discussion => ({
      ...discussion.toObject(),
      likesCount: likeCountMap[discussion._id] || 0,
      repliesCount: repliesCountMap[discussion._id] || 0
    }));
    
    // Sort the discussions based on the requested sort type
    if (sortType === 'recent') {
      populatedDiscussions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortType === 'likes') {
      populatedDiscussions.sort((a, b) => b.likesCount - a.likesCount);
    }
    
    res.json({ discussions: populatedDiscussions });
  } catch (error) {
    res.status(500).json({ message: `Error fetching discussions by tag: ${error.message}` });
  }
});

// Add a reply - protected route
router.post('/:id/replies', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    // Get or create user
    let user = await User.findOne({ clerkId: userId });
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(userId);
      user = await User.create({
        clerkId: userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        username: clerkUser.username || clerkUser.firstName,
        profileImageUrl: clerkUser.imageUrl
      });
    }

    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const reply = new Reply({
      content,
      author: user._id,
      discussion: discussion._id
    });

    await reply.save();

    // Update discussion replies count
    discussion.repliesCount += 1;
    await discussion.save();

    // Update user metrics
    user.totalReplies += 1;
    user.lastActive = new Date();
    await user.save();

    const populatedReply = await Reply.findById(reply._id)
      .populate('author', 'username email clerkId profileImageUrl');

    const io = req.app.get('io');
    io.emit('new-reply', { discussionId: req.params.id, reply: populatedReply });

    res.status(201).json(populatedReply);
  } catch (error) {
    res.status(500).json({ message: `Error posting reply: ${error.message}` });
  }
});

// Update reply - protected route
router.put('/:discussionId/replies/:replyId', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { content } = req.body;
    const { discussionId, replyId } = req.params;

    // Get user
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the reply
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    // Verify the reply belongs to the discussion
    if (reply.discussion.toString() !== discussionId) {
      return res.status(400).json({ message: 'Reply does not belong to this discussion' });
    }

    // Check if user is the author
    if (reply.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this reply' });
    }

    reply.content = content;
    reply.updatedAt = new Date();
    await reply.save();

    const populatedReply = await Reply.findById(replyId)
      .populate('author', 'username email clerkId profileImageUrl');

    const io = req.app.get('io');
    io.emit('update-reply', { discussionId: req.params.discussionId, reply: populatedReply });

    
    res.json(populatedReply);
  } catch (error) {
    res.status(500).json({ message: `Error updating reply: ${error.message}` });
  }
});

// Delete reply - protected route
router.delete('/:discussionId/replies/:replyId', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { discussionId, replyId } = req.params;

    // Get user
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the reply
    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    // Verify the reply belongs to the discussion
    if (reply.discussion.toString() !== discussionId) {
      return res.status(400).json({ message: 'Reply does not belong to this discussion' });
    }

    // Check if user is the author
    if (reply.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this reply' });
    }

    // Update discussion replies count
    const discussion = await Discussion.findById(discussionId);
    if (discussion) {
      discussion.repliesCount = Math.max(0, discussion.repliesCount - 1);
      await discussion.save();
    }

    // Update user metrics
    user.totalReplies = Math.max(0, user.totalReplies - 1);
    user.lastActive = new Date();
    await user.save();

    // Delete associated likes
    await Like.deleteMany({ target: replyId, targetModel: 'Reply' });

    // Delete the reply
    await Reply.findByIdAndDelete(replyId);

    const io = req.app.get('io');
    io.emit('delete-reply', { discussionId: req.params.discussionId, replyId: req.params.replyId });

    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: `Error deleting reply: ${error.message}` });
  }
});


export default router;