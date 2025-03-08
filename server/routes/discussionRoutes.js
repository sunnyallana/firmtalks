import express from 'express';
import { Discussion } from '../models/discussionModel.js';
import { Reply } from '../models/replyModel.js';
import { Like } from '../models/likeModel.js';
import { User } from '../models/userModel.js';
import { Notification } from '../models/notificationModel.js'
import { Bookmark } from '../models/bookmarkModel.js';
import { clerkClient, requireAuth, getAuth } from '@clerk/express';

const router = express.Router();

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

// Add middleware to discussions route
router.use(async (req, res, next) => {
  try {
    const auth = getAuth(req);
    if (auth.userId) {
      const user = await getCurrentUser(auth.userId);
      req.userId = user._id;
    }
    next();
  } catch (error) {
    next(error);
  }
});


// Get all discussions - public route
router.get('/', async (req, res) => {
  try {
    const { sort = 'recent', page = 1, limit = 5 } = req.query;
    const parsedPage = Math.max(parseInt(page), 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit), 1), 50);
    const skip = (parsedPage - 1) * parsedLimit;

    // Get user ID from middleware
    const userId = req.userId;

    // Updated bookmark lookup
    const bookmarkLookup = {
      $lookup: {
        from: 'bookmarks',
        let: { discussionId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$discussion', '$$discussionId'] },
                  ...(userId ? [{ $eq: ['$user', userId] }] : [])
                ]
              }
            }
          },
          { $limit: 1 }
        ],
        as: 'bookmarkInfo'
      }
    };


    const addFieldsStage = {
      $addFields: {
        bookmarked: { $gt: [{ $size: '$bookmarkInfo' }, 0] }
      }
    };

    // Add to your aggregation pipeline
    const pipeline = [
      bookmarkLookup,
      addFieldsStage,
      { $project: { bookmarkInfo: 0 } }
    ];

    // Sorting logic
    let sortOptions = {};
    switch (sort) {
      case 'recent':
        sortOptions = { createdAt: -1 };
        break;
      case 'likes':
        sortOptions = { likesCount: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    // Get total count and paginated discussions
    const total = await Discussion.countDocuments();
    const totalPages = Math.ceil(total / parsedLimit);

    const discussions = await Discussion.aggregate([
      ...pipeline,
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: parsedLimit },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author'
        }
      },
      { $unwind: '$author' }
    ]);

    res.json({
      discussions,
      totalPages,
      currentPage: parsedPage,
      totalItems: total
    });
  } catch (error) {
    console.error('Error in GET /api/discussions:', error);
    res.status(500).json({ message: `Error fetching discussions: ${error.message}` });
  }
});


// Get single discussion with replies - public route
router.get('/:id', async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('author', 'username email clerkId profileImageUrl');

    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Check if the discussion is bookmarked by the user
    let bookmarked = false;
    if (req.userId) {
      const bookmark = await Bookmark.findOne({ 
        user: req.userId, 
        discussion: discussion._id 
      });
      bookmarked = !!bookmark;
    }

    // Parse reply pagination parameters
    const { replyPage = 1, replyLimit = 10 } = req.query;
    const parsedReplyPage = Math.max(parseInt(replyPage), 1);
    const parsedReplyLimit = Math.min(Math.max(parseInt(replyLimit), 1), 50);
    const replySkip = (parsedReplyPage - 1) * parsedReplyLimit;

    // Get paginated replies
    const replies = await Reply.find({ discussion: req.params.id })
      .populate('author', 'username email clerkId profileImageUrl')
      .sort({ createdAt: 1 })
      .skip(replySkip)
      .limit(parsedReplyLimit);

    // Get total replies count
    const totalReplies = await Reply.countDocuments({ discussion: req.params.id });
    const totalReplyPages = Math.ceil(totalReplies / parsedReplyLimit);

    // Get like counts for discussion and replies
    const targetIds = [discussion._id, ...replies.map(r => r._id)];
    const likes = await Like.find({
      target: { $in: targetIds }
    });

    const likeCountMap = likes.reduce((acc, like) => {
      acc[like.target] = (acc[like.target] || 0) + 1;
      return acc;
    }, {});

    const populatedDiscussion = {
      ...discussion.toObject(),
      bookmarked, // Add the bookmarked field
      likesCount: likeCountMap[discussion._id] || 0,
      replies: {
        items: replies.map(reply => ({
          ...reply.toObject(),
          likesCount: likeCountMap[reply._id] || 0
        })),
        pagination: {
          totalPages: totalReplyPages,
          currentPage: parsedReplyPage,
          totalItems: totalReplies
        }
      }
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
    user.totalDiscussions += 1;
    user.lastActive = new Date();
    await user.save();
   

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

    const targetAuthor = await (targetType === 'discussions' 
      ? Discussion.findById(id).select('author')
      : Reply.findById(id).select('author'));
    
    const io = req.app.get('io');
    io.emit('like-update', {
      targetModel,
      targetId: id,
      discussionId: target.discussion,
      likesCount: target.likesCount,
      userId: user._id.toString(),
      action: existingLike ? 'unlike' : 'like'
    });

    if (targetAuthor.author.toString() !== user._id.toString()) {
      const notification = await Notification.create({
        recipient: targetAuthor.author,
        sender: user._id,
        type: 'like',
        discussion: target.discussion || target._id,
        [targetType === 'discussions' ? 'discussion' : 'reply']: id
      });
    
      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'username profileImageUrl')
        .populate('discussion', 'title')
        .populate('reply', 'content');
    
        if (targetAuthor.author.toString() !== user._id.toString()) {
          const io = req.app.get('io');
          io.to(`user_${targetAuthor.author}`).emit('new-notification', populatedNotification);
        }
    }
    
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
    
    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    if (discussion.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this discussion' });
    }

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

    // Get all reply IDs for the discussion
    const replyIds = await Reply.find({ discussion: discussion._id }).distinct('_id');

    // Find all likes to delete (both discussion and replies)
    const likesToDelete = await Like.find({
      $or: [
        { target: discussion._id, targetModel: 'Discussion' },
        { target: { $in: replyIds }, targetModel: 'Reply' }
      ]
    });

    // Group likes by user and count
    const likesByUser = {};
    likesToDelete.forEach(like => {
      const userId = like.user.toString();
      likesByUser[userId] = (likesByUser[userId] || 0) + 1;
    });

    // Update each user's totalLikes
    for (const userId of Object.keys(likesByUser)) {
      const count = likesByUser[userId];
      await User.findByIdAndUpdate(userId, { $inc: { totalLikes: -count } });
    }

    // Delete the likes
    await Like.deleteMany({
      _id: { $in: likesToDelete.map(like => like._id) }
    });

    await Reply.deleteMany({ discussion: discussion._id });
    await Discussion.findByIdAndDelete(req.params.id);

    user.totalDiscussions = Math.max(0, user.totalDiscussions - 1);
    user.lastActive = new Date();
    await user.save();
    
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
    const discussions = await Discussion.find({ tags: tag })
      .populate('author', 'username email clerkId profileImageUrl')
      .sort({ createdAt: -1 });

    const discussionIds = discussions.map(d => d._id);
    const likeCounts = await Like.aggregate([
      { $match: { targetModel: 'Discussion', target: { $in: discussionIds } } },
      { $group: { _id: '$target', count: { $sum: 1 } } }
    ]);

    const likeCountMap = likeCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    const populatedDiscussions = discussions.map(discussion => ({
      ...discussion.toObject(),
      likesCount: likeCountMap[discussion._id] || 0
    }));

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

    if (discussion.author.toString() !== user._id.toString()) {
      const notification = await Notification.create({
        recipient: discussion.author,
        sender: user._id,
        type: 'reply',
        discussion: discussion._id,
        reply: reply._id
      });
      
      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'username profileImageUrl')
        .populate('discussion', 'title')
        .populate('reply', 'content');
      
        if (discussion.author.toString() !== user._id.toString()) {
          const io = req.app.get('io');
          io.to(`user_${discussion.author}`).emit('new-notification', populatedNotification);
        }
    }

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

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    if (reply.discussion.toString() !== discussionId) {
      return res.status(400).json({ message: 'Reply does not belong to this discussion' });
    }

    if (reply.author.toString() !== user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this reply' });
    }

    // Find all likes to delete on this reply
    const likesToDelete = await Like.find({ target: replyId, targetModel: 'Reply' });

    // Group likes by user and count
    const likesByUser = {};
    likesToDelete.forEach(like => {
      const userId = like.user.toString();
      likesByUser[userId] = (likesByUser[userId] || 0) + 1;
    });

    // Update each user's totalLikes
    for (const userId of Object.keys(likesByUser)) {
      const count = likesByUser[userId];
      await User.findByIdAndUpdate(userId, { $inc: { totalLikes: -count } });
    }

    // Delete the likes
    await Like.deleteMany({ _id: { $in: likesToDelete.map(like => like._id) } });

    const discussion = await Discussion.findById(discussionId);
    if (discussion) {
      discussion.repliesCount = Math.max(0, discussion.repliesCount - 1);
      await discussion.save();
    }

    user.totalReplies = Math.max(0, user.totalReplies - 1);
    user.lastActive = new Date();
    await user.save();

    await Reply.findByIdAndDelete(replyId);

    const io = req.app.get('io');
    io.emit('delete-reply', { discussionId: req.params.discussionId, replyId: req.params.replyId });

    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: `Error deleting reply: ${error.message}` });
  }
});


export default router;