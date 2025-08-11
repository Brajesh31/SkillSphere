import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  connectedProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  avatar: {
    type: String, // Save avatar URL
  },
  username: {
    type: String, // Save username
  },
  skills: [
    {
      name: String,
      level: Number,
    },
  ],
  bio: {
    type: String, // Save bio
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Connection = mongoose.model('Connection', connectionSchema);
export default Connection;
