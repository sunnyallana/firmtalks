// likeModel.js
import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // The item being liked (either Discussion or Reply)
  target: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    required: true,
    enum: ['Discussion', 'Reply']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure a user can only like something once
likeSchema.index({ user: 1, target: 1 }, { unique: true });

export const Like = mongoose.model('Like', likeSchema);