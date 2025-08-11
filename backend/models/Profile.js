import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  avatar: String,
  bio: String,
  skills: [{
    name: String,
    level: Number,
    endorsements: { type: Number, default: 0 }
  }],
  experience: [{
    title: String,
    company: String,
    duration: String,
    description: String
  }],
  education: [{
    degree: String,
    institution: String,
    year: String
  }],
  role: {
    type: String,
    enum: ['student', 'mentor'],
    required: true,
    default: 'student' // Default role
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Profile = mongoose.model('Profile', profileSchema);
export default Profile;