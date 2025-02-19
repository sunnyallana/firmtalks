// discussionModel.js
import mongoose from 'mongoose';

const discussionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    minLength: 10,
  },
  content: {
    type: String,
    required: true,
    minLength: 30,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  likesCount: {
    type: Number,
    default: 0
  },
  repliesCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

discussionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Discussion = mongoose.model('Discussion', discussionSchema);