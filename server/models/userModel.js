import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  profileImageUrl: {
    type: String,
    default: ''
  },
  // Metrics
  totalLikes: {
    type: Number,
    default: 0
  },
  totalMalwareScans: {
    type: Number,
    default: 0
  },
  totalReplies: {
    type: Number,
    default: 0
  },
  reputation: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

export const User = mongoose.model('User', userSchema);