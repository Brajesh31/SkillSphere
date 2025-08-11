import mongoose from "mongoose";

const recordingSchema = new mongoose.Schema({
  fileName: { 
    type: String, 
    required: true 
  },
  roomId: { 
    type: String, 
    required: true 
  },
  roomName: { 
    type: String, 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  fileSize: { 
    type: Number 
  },
  duration: { 
    type: Number 
  }
});

const Recording = mongoose.model('Recording', recordingSchema);
export default Recording;