import mongoose from 'mongoose';

const replySchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  likes: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
},{ _id: true });

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
    type: String,
    required: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  likes: [{
    type: String,
  }],
  replies: [replySchema],
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