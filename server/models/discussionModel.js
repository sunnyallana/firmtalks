import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  author: {
    type: String, // This will store the Clerk User ID
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  likes: [{
    type: String // Clerk User IDs
  }]
});

const discussionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String, // This will store the Clerk User ID
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  likes: [{
    type: String // Clerk User IDs
  }],
  replies: [replySchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Export the model directly
export const Discussion = mongoose.model('Discussion', discussionSchema);