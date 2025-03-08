import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  discussion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

bookmarkSchema.index({ user: 1, discussion: 1 }, { unique: true });

export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);