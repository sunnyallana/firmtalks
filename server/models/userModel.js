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
  totalDiscussions: {
    type: Number,
    default: 0
  },
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

// Method to calculate reputation
userSchema.methods.calculateReputation = function() {
  // Weights for different metrics
  const discussionWeight = 5;
  const likeWeight = 2;
  const malwareScanWeight = 10;
  const replyWeight = 3;
  
  // Basic reputation calculation
  const baseReputation = (
    this.totalDiscussions * discussionWeight +
    this.totalLikes * likeWeight +
    this.totalMalwareScans * malwareScanWeight +
    this.totalReplies * replyWeight
  );
  
  // Calculate activity recency factor
  const daysSinceLastActive = Math.max(
    0, 
    (Date.now() - this.lastActive) / (1000 * 60 * 60 * 24)
  );
  const recencyMultiplier = Math.max(0.5, 1 - (daysSinceLastActive / 30));
  
  // Apply recency factor to reputation
  this.reputation = Math.round(baseReputation * recencyMultiplier);
  
  return this.reputation;
};

// Update reputation when relevant fields change
userSchema.pre('save', function(next) {
  if (
    this.isModified('totalDiscussions') ||
    this.isModified('totalLikes') ||
    this.isModified('totalMalwareScans') ||
    this.isModified('totalReplies') ||
    this.isModified('lastActive')
  ) {
    this.calculateReputation();
  }
  next();
});

// Update the lastActive timestamp
userSchema.methods.updateActivity = function() {
  this.lastActive = Date.now();
  return this.save();
};

// Static method to find most reputable users
userSchema.statics.findTopUsers = function(limit = 10) {
  return this.find()
    .sort({ reputation: -1 })
    .limit(limit);
};

export const User = mongoose.model('User', userSchema);