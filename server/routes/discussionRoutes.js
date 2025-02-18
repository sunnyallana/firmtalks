import express from 'express';
import { Discussion } from '../models/discussionModel.js';
import { clerkClient, requireAuth, getAuth } from '@clerk/express';

const router = express.Router();

// Helper function to get user details from Clerk
async function getUserDetails(userId) {
  try {
    const user = await clerkClient.users.getUser(userId);
    return {
      id: user.id,
      username: user.username || user.firstName,
      profileImageUrl: user.profileImageUrl,
      firstName: user.firstName,
      lastName: user.lastName
    };
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return { id: userId, username: 'Unknown User' };
  }
}

// Helper function to get multiple users' details
async function getMultipleUserDetails(userIds) {
  const uniqueIds = [...new Set(userIds)];
  const users = await Promise.all(uniqueIds.map(getUserDetails));
  return users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});
}

// Get all discussions with pagination - public route
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const totalDiscussions = await Discussion.countDocuments();
    const discussions = await Discussion.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Get unique list of all user IDs
    const userIds = discussions.reduce((ids, discussion) => {
      ids.add(discussion.author);
      discussion.replies?.forEach(reply => ids.add(reply.author));
      return ids;
    }, new Set());

    const userDetails = await getMultipleUserDetails([...userIds]);

    const populatedDiscussions = discussions.map(discussion => ({
      ...discussion.toObject(),
      author: userDetails[discussion.author],
      replies: discussion.replies?.map(reply => ({
        ...reply,
        author: userDetails[reply.author]
      }))
    }));

    res.json({
      discussions: populatedDiscussions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDiscussions / limit),
        totalDiscussions,
        hasMore: skip + discussions.length < totalDiscussions
      }
    });
  } catch (error) {
    res.status(500).json({ message: `Error fetching discussions: ${error.message}` });
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

    const discussion = new Discussion({
      title,
      content,
      author: userId,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });
    
    await discussion.save();
    const authorDetails = await getUserDetails(userId);
    
    res.status(201).json({
      ...discussion.toObject(),
      author: authorDetails
    });
  } catch (error) {
    res.status(500).json({ message: `Error creating discussion: ${error.message}` });
  }
});

// Get single discussion with replies pagination - public route
router.get('/:id', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.repliesLimit) || 20;
    const skip = (page - 1) * limit;

    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Paginate replies
    const totalReplies = discussion.replies.length;
    discussion.replies = discussion.replies.slice(skip, skip + limit);

    const userIds = new Set([
      discussion.author,
      ...discussion.replies.map(reply => reply.author)
    ]);

    const userDetails = await getMultipleUserDetails([...userIds]);

    const populatedDiscussion = {
      ...discussion.toObject(),
      author: userDetails[discussion.author],
      replies: discussion.replies.map(reply => ({
        ...reply,
        author: userDetails[reply.author]
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReplies / limit),
        totalReplies,
        hasMore: skip + discussion.replies.length < totalReplies
      }
    };

    res.json(populatedDiscussion);
  } catch (error) {
    res.status(500).json({ message: `Error fetching discussion: ${error.message}` });
  }
});

// Update discussion - protected route
router.put('/:id', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { title, content, tags } = req.body;
    
    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    // Check if user is the author
    if (discussion.author !== userId) {
      return res.status(403).json({ message: 'Not authorized to edit this discussion' });
    }
    
    discussion.title = title || discussion.title;
    discussion.content = content || discussion.content;
    discussion.tags = tags ? tags.split(',').map(tag => tag.trim()) : discussion.tags;
    discussion.updatedAt = new Date();
    
    await discussion.save();
    
    const authorDetails = await getUserDetails(userId);
    
    res.json({
      ...discussion.toObject(),
      author: authorDetails
    });
  } catch (error) {
    res.status(500).json({ message: `Error updating discussion: ${error.message}` });
  }
});

// Delete discussion - protected route
router.delete('/:id', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    // Check if user is the author
    if (discussion.author !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this discussion' });
    }
    
    await Discussion.findByIdAndDelete(req.params.id);
    res.json({ message: 'Discussion deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: `Error deleting discussion: ${error.message}` });
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

    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    const newReply = {
      content,
      author: userId,
      createdAt: new Date(),
      likes: []
    };

    discussion.replies.push(newReply);
    await discussion.save();

    // Return the newly created reply with its ID
    const createdReply = discussion.replies[discussion.replies.length - 1];
    res.status(201).json(createdReply);
  } catch (error) {
    res.status(500).json({ message: `Error posting reply: ${error.message}` });
  }
});

// Update reply - protected route
router.put('/:id/replies/:replyId', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { content } = req.body;
    
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    // Find the reply in the replies array using the subdocument method
    const reply = discussion.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    
    if (reply.author !== userId) {
      return res.status(403).json({ message: 'Not authorized to edit this reply' });
    }
    
    reply.content = content;
    reply.updatedAt = new Date();
    
    await discussion.save();
    
    const authorDetails = await getUserDetails(userId);
    
    res.json({
      ...reply.toObject(),
      author: authorDetails
    });
  } catch (error) {
    res.status(500).json({ message: `Error updating reply: ${error.message}` });
  }
});


// Delete reply - protected route
router.delete('/:id/replies/:replyId', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    // Find the reply in the replies array using the subdocument method
    const reply = discussion.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    
    if (reply.author !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this reply' });
    }
    
    // Remove the reply using MongoDB's subdocument pull method
    discussion.replies.pull(req.params.replyId);
    await discussion.save();
    
    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: `Error deleting reply: ${error.message}` });
  }
});


// Like/unlike a discussion - protected route
router.post('/:id/like', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    const likeIndex = discussion.likes.indexOf(userId);
    if (likeIndex === -1) {
      discussion.likes.push(userId);
    } else {
      discussion.likes.splice(likeIndex, 1);
    }
    
    await discussion.save();
    
    const userDetails = await getUserDetails(discussion.author);
    
    res.json({
      ...discussion.toObject(),
      author: userDetails
    });
  } catch (error) {
    res.status(500).json({ message: `Error liking discussion: ${error.message}` });
  }
});

// Like/unlike a reply - protected route
router.post('/:id/replies/:replyId/like', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    // Find the reply in the replies array using the subdocument method
    const reply = discussion.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }
    
    const likeIndex = reply.likes.indexOf(userId);
    if (likeIndex === -1) {
      reply.likes.push(userId);
    } else {
      reply.likes.splice(likeIndex, 1);
    }
    
    await discussion.save();
    
    // Get author details for the modified reply
    const authorDetails = await getUserDetails(reply.author);
    
    res.json({
      ...reply.toObject(),
      author: authorDetails
    });
  } catch (error) {
    res.status(500).json({ message: `Error liking reply: ${error.message}` });
  }
});



// Get discussions by tag - public route
router.get('/tags/:tag', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const tag = req.params.tag.toLowerCase();
    const totalDiscussions = await Discussion.countDocuments({ tags: tag });
    
    const discussions = await Discussion.find({ tags: tag })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const userIds = discussions.reduce((ids, discussion) => {
      ids.add(discussion.author);
      return ids;
    }, new Set());

    const userDetails = await getMultipleUserDetails([...userIds]);

    const populatedDiscussions = discussions.map(discussion => ({
      ...discussion.toObject(),
      author: userDetails[discussion.author]
    }));

    res.json({
      discussions: populatedDiscussions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalDiscussions / limit),
        totalDiscussions,
        hasMore: skip + discussions.length < totalDiscussions
      }
    });
  } catch (error) {
    res.status(500).json({ message: `Error fetching discussions by tag: ${error.message}` });
  }
});

export default router;