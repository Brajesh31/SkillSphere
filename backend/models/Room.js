import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  meetingId: { 
    type: String, 
    required: true, 
    unique: true, 
    default: function () { 
      return `room-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`; 
    } // Ensure unique meetingId generation
  },
  name: { type: String, required: true },
  password: { type: String },
  maxParticipants: { type: Number, default: 10 },
  duration: { type: Number, default: 60 }, // in minutes
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    isHost: Boolean
  }],
  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date }
});

const Room = mongoose.model('Room', roomSchema);
export default Room;