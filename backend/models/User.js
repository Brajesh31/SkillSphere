// backend/models/User.js
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Changed from mentorId to mentor
  mentee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Changed from menteeId to mentee
  duration: Number, // in minutes
  date: { type: Date, default: Date.now },
  skillsPracticed: [String],
  rating: Number,
  feedback: String
});

const badgeSchema = new mongoose.Schema({
  name: String,
  description: String,
  earnedAt: { type: Date, default: Date.now },
  type: { type: String, enum: ['mentor', 'mentee', 'general'] }
});

const userSchema = new mongoose.Schema({
  fullName: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  password: String,
  verified: { type: Boolean, default: false },
  role: { 
    type: String, 
    enum: ['student', 'mentor', 'both'],
    default: 'student'
  },
  photo: String,
  skills: [{
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    }
  }],
  badges: [badgeSchema],
  sessions: [sessionSchema],
  connections: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'] },
    createdAt: { type: Date, default: Date.now }
  }],
  xpPoints: { type: Number, default: 0 },
  level: { 
    levelNumber: { type: Number, default: 1 },
    progress: { type: Number, default: 0 } // percentage to next level
  },
  lastActive: Date,
  bio: String
}, { timestamps: true });

// Calculate level based on XP
userSchema.methods.calculateLevel = function() {
  const xpNeeded = Math.pow(this.level.levelNumber, 2) * 100;
  if (this.xpPoints >= xpNeeded) {
    this.level.levelNumber += 1;
    this.level.progress = 0;
    this.badges.push({
      name: `Level ${this.level.levelNumber}`,
      description: `Reached level ${this.level.levelNumber}`,
      type: 'general'
    });
  } else {
    this.level.progress = Math.floor((this.xpPoints / xpNeeded) * 100);
  }
};

const User = mongoose.model("User", userSchema);
export default User;