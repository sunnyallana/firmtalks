import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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

likeSchema.index({ user: 1, target: 1 }, { unique: true });

export const Like = mongoose.model('Like', likeSchema);