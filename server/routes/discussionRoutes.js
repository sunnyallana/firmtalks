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

// Get all discussions - public route
router.get('/', async (req, res) => {
  try {
    const discussions = await Discussion.find().sort({ createdAt: -1 });
    
    // Get unique list of all user IDs (authors and reply authors)
    const userIds = discussions.reduce((ids, discussion) => {
      ids.add(discussion.author);
      discussion.replies?.forEach(reply => ids.add(reply.author));
      return ids;
    }, new Set());

    // Fetch all user details at once
    const userDetails = await getMultipleUserDetails([...userIds]);

    // Attach user details to discussions
    const populatedDiscussions = discussions.map(discussion => ({
      ...discussion.toObject(),
      author: userDetails[discussion.author],
      replies: discussion.replies?.map(reply => ({
        ...reply,
        author: userDetails[reply.author]
      }))
    }));

    res.json(populatedDiscussions);
  } catch (error) {
    res.status(500).json({ message: `Error fetching discussions: ${error.message}` });
  }
});

// Create a new discussion - protected route
router.post('/', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { title, content, tags } = req.body;
    
    const discussion = new Discussion({
      title,
      content,
      author: userId,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    });
    
    await discussion.save();
    
    // Get author details from Clerk
    const authorDetails = await getUserDetails(userId);
    
    res.status(201).json({
      ...discussion.toObject(),
      author: authorDetails
    });
  } catch (error) {
    res.status(500).json({ message: `Error creating discussion: ${error.message}` });
  }
});

// Get single discussion - public route
router.get('/:id', async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }

    // Get all user IDs from discussion and replies
    const userIds = new Set([
      discussion.author,
      ...discussion.replies.map(reply => reply.author)
    ]);

    // Fetch all user details at once
    const userDetails = await getMultipleUserDetails([...userIds]);

    // Attach user details to discussion and replies
    const populatedDiscussion = {
      ...discussion.toObject(),
      author: userDetails[discussion.author],
      replies: discussion.replies.map(reply => ({
        ...reply,
        author: userDetails[reply.author]
      }))
    };

    res.json(populatedDiscussion);
  } catch (error) {
    res.status(500).json({ message: `Error fetching discussion: ${error.message}` });
  }
});

// Add a reply - protected route
router.post('/:id/replies', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { content } = req.body;
    
    const discussion = await Discussion.findById(req.params.id);
    if (!discussion) {
      return res.status(404).json({ message: 'Discussion not found' });
    }
    
    discussion.replies.push({
      content,
      author: userId
    });
    
    await discussion.save();
    
    // Get all user details
    const userIds = new Set([
      discussion.author,
      ...discussion.replies.map(reply => reply.author)
    ]);
    const userDetails = await getMultipleUserDetails([...userIds]);

    // Return populated discussion
    const populatedDiscussion = {
      ...discussion.toObject(),
      author: userDetails[discussion.author],
      replies: discussion.replies.map(reply => ({
        ...reply,
        author: userDetails[reply.author]
      }))
    };

    res.json(populatedDiscussion);
  } catch (error) {
    res.status(500).json({ message: `Error posting reply: ${error.message}` });
  }
});

// Get user profile - protected route
router.get('/user-profile', requireAuth(), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const userDetails = await getUserDetails(userId);
    res.json(userDetails);
  } catch (error) {
    res.status(500).json({ message: `Error fetching user profile: ${error.message}` });
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

    // Get user details for the response
    const userDetails = await getUserDetails(discussion.author);
    
    res.json({
      ...discussion.toObject(),
      author: userDetails
    });
  } catch (error) {
    res.status(500).json({ message: `Error liking discussion: ${error.message}` });
  }
});

export default router;