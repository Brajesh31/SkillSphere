import Room from '../models/Room.js';
import Recording from '../models/Recording.js';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  const rooms = {}; // In-memory storage for room participants and their statuses

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle joining a room
    socket.on('join-room', ({ roomId, userId, name, isHost }) => {
      console.log(`${name} joining room ${roomId}, Host: ${isHost}`);
      
      // Initialize room if it doesn't exist
      if (!rooms[roomId]) {
        rooms[roomId] = {
          participants: [],
          activeScreenShare: null
        };
      }
      
      // Check if user is already in the room (e.g., after a reconnect)
      const existingParticipant = rooms[roomId].participants.find(p => p.userId === userId);
      if (existingParticipant) {
        // Update the socket id and other properties
        existingParticipant.id = socket.id;
        existingParticipant.name = name;
        existingParticipant.isHost = isHost; // Make sure host status is preserved
      } else {
        // Add new participant
        rooms[roomId].participants.push({ 
          id: socket.id, 
          userId, 
          name, 
          isHost,
          isHandRaised: false,
          isMuted: false,
          isVideoOff: false
        });
      }

      socket.join(roomId);
      
      // Send current participants to the new user
      io.to(socket.id).emit('room-info', {
        participants: rooms[roomId].participants,
        activeScreenShare: rooms[roomId].activeScreenShare
      });
      
      // Inform everyone about the new participant
      io.to(roomId).emit('update-participants', rooms[roomId].participants);
      console.log(`Room ${roomId} participants:`, rooms[roomId].participants.map(p => ({name: p.name, isHost: p.isHost})));
    });

    // Handle participant leaving
    socket.on('leave-room', ({ roomId }) => {
      if (rooms[roomId]) {
        const participant = rooms[roomId].participants.find(p => p.id === socket.id);
        if (participant) {
          // Check if they were the active screen sharer
          if (rooms[roomId].activeScreenShare === participant.userId) {
            rooms[roomId].activeScreenShare = null;
            io.to(roomId).emit('screen-share-stopped', { userId: participant.userId });
          }
          
          // Remove from participants array
          rooms[roomId].participants = rooms[roomId].participants.filter(p => p.id !== socket.id);
          io.to(roomId).emit('update-participants', rooms[roomId].participants);
          
          // If the host left, try to assign a new host
          if (participant.isHost && rooms[roomId].participants.length > 0) {
            const newHost = rooms[roomId].participants[0];
            newHost.isHost = true;
            io.to(roomId).emit('new-host', { userId: newHost.userId, name: newHost.name });
            io.to(roomId).emit('update-participants', rooms[roomId].participants);
          }
        }
        
        // Clean up empty rooms
        if (rooms[roomId].participants.length === 0) {
          delete rooms[roomId];
        }
      }
      
      socket.leave(roomId);
    });

    // Handle sending a chat message
    socket.on('send-message', ({ roomId, messageId, senderId, senderName, message, timestamp }) => {
      console.log(`Message sent to room ${roomId} by ${senderName}`);
      
      // Broadcast the message to all participants in the room
      io.to(roomId).emit('receiveMessage', {
        id: messageId,
        senderId,
        senderName,
        message,
        timestamp
      });
    });

    // Handle screen sharing requests and status
    socket.on('request-screen-share', ({ roomId, userId, name }) => {
      if (!rooms[roomId]) return;
      
      // Find a host to send the request to
      const host = rooms[roomId].participants.find(p => p.isHost);
      if (host) {
        // Send request to host
        io.to(host.id).emit('screen-share-request', { userId, name });
        
        // Also notify the requester that their request was sent
        const requester = rooms[roomId].participants.find(p => p.userId === userId);
        if (requester) {
          io.to(requester.id).emit('screen-share-request-sent', { hostName: host.name });
        }
      } else {
        // No host found, auto-approve for now
        const requester = rooms[roomId].participants.find(p => p.userId === userId);
        if (requester) {
          io.to(requester.id).emit('screen-share-approved');
        }
      }
    });
    
    // Handle host approving screen share request
    socket.on('approve-screen-share', ({ roomId, userId }) => {
      if (!rooms[roomId]) return;
      
      // Verify the sender is a host
      const sender = rooms[roomId].participants.find(p => p.id === socket.id);
      if (!sender || !sender.isHost) return;
      
      // Find the participant who requested screen sharing
      const requester = rooms[roomId].participants.find(p => p.userId === userId);
      if (requester) {
        io.to(requester.id).emit('screen-share-approved');
      }
    });
    
    // Handle host rejecting screen share request
    socket.on('reject-screen-share', ({ roomId, userId, reason }) => {
      if (!rooms[roomId]) return;
      
      // Verify the sender is a host
      const sender = rooms[roomId].participants.find(p => p.id === socket.id);
      if (!sender || !sender.isHost) return;
      
      // Find the participant who requested screen sharing
      const requester = rooms[roomId].participants.find(p => p.userId === userId);
      if (requester) {
        io.to(requester.id).emit('screen-share-rejected', { 
          reason: reason || 'Your screen sharing request was rejected by the host'
        });
      }
    });
    
    socket.on('screen-share-started', ({ roomId, userId }) => {
      if (!rooms[roomId]) return;
      
      // Only allow one screen share at a time
      if (rooms[roomId].activeScreenShare && rooms[roomId].activeScreenShare !== userId) {
        // Find socket of the user who requested screen share
        const requester = rooms[roomId].participants.find(p => p.userId === userId);
        if (requester) {
          io.to(requester.id).emit('screen-share-rejected', {
            reason: 'Another user is already sharing their screen'
          });
          return;
        }
      }
      
      // Allow the screen share
      rooms[roomId].activeScreenShare = userId;
      io.to(roomId).emit('screen-share-started', { userId });
    });
    
    socket.on('screen-share-stopped', ({ roomId, userId }) => {
      if (!rooms[roomId]) return;
      
      if (rooms[roomId].activeScreenShare === userId) {
        rooms[roomId].activeScreenShare = null;
      }
      io.to(roomId).emit('screen-share-stopped', { userId });
    });
    
    // Handle raised hands
    socket.on('raise-hand', ({ roomId, userId, name }) => {
      if (!rooms[roomId]) return;
      
      const participant = rooms[roomId].participants.find(p => p.userId === userId);
      if (participant) {
        participant.isHandRaised = true;
        
        // Auto reset after 10 seconds
        setTimeout(() => {
          if (rooms[roomId] && participant) {
            participant.isHandRaised = false;
            io.to(roomId).emit('update-participants', rooms[roomId].participants);
          }
        }, 10000);
      }
      
      io.to(roomId).emit('raise-hand', { userId, name });
      io.to(roomId).emit('update-participants', rooms[roomId].participants);
    });
    
    // Handle host actions
    socket.on('host-action', ({ roomId, action, targetId, hostName }) => {
      if (!rooms[roomId]) return;
      
      // Verify the sender is a host
      const sender = rooms[roomId].participants.find(p => p.id === socket.id);
      if (!sender || !sender.isHost) return;
      
      switch (action) {
        case 'mute':
          // Update participant status
          const targetParticipant = rooms[roomId].participants.find(p => p.userId === targetId);
          if (targetParticipant) {
            targetParticipant.isMuted = true;
          }
          // Notify the target to mute themselves
          io.to(roomId).emit('host-action', { action, targetId, hostName });
          io.to(roomId).emit('update-participants', rooms[roomId].participants);
          break;
          
        case 'remove':
          // Find the participant to remove
          const participantToRemove = rooms[roomId].participants.find(p => p.userId === targetId);
          if (participantToRemove) {
            // Notify the participant they've been removed
            io.to(participantToRemove.id).emit('you-were-removed', { hostName });
            
            // Remove them from the room
            rooms[roomId].participants = rooms[roomId].participants.filter(p => p.userId !== targetId);
            io.to(roomId).emit('update-participants', rooms[roomId].participants);
          }
          break;
          
        case 'end-meeting':
          // Notify all participants that the meeting is ending
          io.to(roomId).emit('meeting-ended', { hostName });
          
          // Clean up the room
          delete rooms[roomId];
          break;
      }
    });

    // Handle disconnecting
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Find all rooms the user was in
      for (const roomId in rooms) {
        const participant = rooms[roomId].participants.find(p => p.id === socket.id);
        if (participant) {
          // Check if they were the active screen sharer
          if (rooms[roomId].activeScreenShare === participant.userId) {
            rooms[roomId].activeScreenShare = null;
            io.to(roomId).emit('screen-share-stopped', { userId: participant.userId });
          }
          
          // Remove from participants array
          rooms[roomId].participants = rooms[roomId].participants.filter(p => p.id !== socket.id);
          io.to(roomId).emit('update-participants', rooms[roomId].participants);
          
          // If the host disconnected, try to assign a new host
          if (participant.isHost && rooms[roomId].participants.length > 0) {
            const newHost = rooms[roomId].participants[0];
            newHost.isHost = true;
            io.to(roomId).emit('new-host', { userId: newHost.userId, name: newHost.name });
            io.to(roomId).emit('update-participants', rooms[roomId].participants);
          }
          
          // Clean up empty rooms
          if (rooms[roomId].participants.length === 0) {
            delete rooms[roomId];
          }
        }
      }
    });
  });
};

export const createRoom = async (req, res) => {
  try {
    const { name, password, maxParticipants, duration } = req.body;

    let room;
    let attempts = 0;

    // Retry logic for duplicate meetingId errors
    while (attempts < 3) {
      try {
        room = new Room({
          name,
          password,
          maxParticipants,
          duration,
          host: req.user._id
        });

        if (!room.meetingId) {
          throw new Error('Failed to generate a unique meeting ID');
        }

        await room.save();
        break; // Exit loop if save is successful
      } catch (error) {
        if (error.code === 11000 && error.keyPattern?.meetingId) {
          console.error('Duplicate meetingId detected. Retrying...');
          attempts++;
        } else {
          throw error; // Re-throw other errors
        }
      }
    }

    if (!room) {
      throw new Error('Failed to create room after multiple attempts');
    }

    res.status(201).json({ meetingId: room.meetingId, message: 'Room created successfully' });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Failed to create room' });
  }
};

export const joinRoom = async (req, res) => {
  try {
    const { meetingId, password } = req.body;
    const userId = req.user._id; // Current user ID from auth middleware

    const room = await Room.findOne({ meetingId }).populate('host', 'fullName');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.password && room.password !== password) {
      return res.status(403).json({ message: 'Incorrect password' });
    }
    
    // Check if max participants limit has been reached (excluding host)
    const participantCount = room.participants.length;
    const isHost = room.host.toString() === userId.toString();
    
    if (participantCount >= room.maxParticipants && !isHost) {
      return res.status(403).json({ message: 'Room has reached maximum participant capacity' });
    }
    
    // Check if the user is the host
    
    // Add participant to the room if not already there
    const participantExists = room.participants.some(
      p => p.userId && p.userId.toString() === userId.toString()
    );
    
    if (!participantExists) {
      // Add to participants array
      room.participants.push({
        userId: userId,
        name: req.user.fullName,
        isHost: isHost
      });
      await room.save();
    }
    
    // Set hostName and isCurrentUserHost for easy access in the frontend
    const responseRoom = room.toObject();
    responseRoom.hostName = room.host.fullName || 'Host';
    responseRoom.isCurrentUserHost = isHost;

    res.status(200).json({ 
      room: responseRoom,
      message: isHost ? 'Welcome back, host!' : 'Successfully joined the room'
    });
  } catch (error) {
    console.error('Error joining room:', error);
    res.status(500).json({ message: 'Failed to join room' });
  }
};

export const getRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id; // Current user ID from auth middleware

    const room = await Room.findOne({ meetingId: id }).populate('host', 'fullName');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check if the current user is the host
    const isHost = room.host._id.toString() === userId.toString();
    
    // Format the response for the frontend
    const responseRoom = room.toObject();
    responseRoom.hostName = room.host.fullName || 'Host';
    responseRoom.isCurrentUserHost = isHost;

    res.status(200).json({ room: responseRoom });
  } catch (error) {
    console.error('Error fetching room:', error);
    res.status(500).json({ message: 'Failed to fetch room' });
  }
};

// Recording-related controller functions
export const saveRecording = async (req, res) => {
  try {
    const userId = req.user._id;
    const { roomId, roomName } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No recording file provided' });
    }
    
    // Ensure the recordings directory exists
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'recordings');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Create recording entry in database
    const recording = new Recording({
      fileName: req.file.filename,
      roomId,
      roomName,
      userId,
      fileSize: req.file.size,
      // We don't know actual duration here, could be added later
    });
    
    await recording.save();
    
    res.status(201).json({ 
      message: 'Recording saved successfully',
      recording
    });
  } catch (error) {
    console.error('Error saving recording:', error);
    res.status(500).json({ message: 'Failed to save recording' });
  }
};

export const getUserRecordings = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const recordings = await Recording.find({ userId })
      .sort({ createdAt: -1 }) // Most recent first
      .lean();
    
    res.status(200).json({ recordings });
  } catch (error) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({ message: 'Failed to fetch recordings' });
  }
};

export const deleteRecording = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find recording and verify ownership
    const recording = await Recording.findById(id);
    
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }
    
    if (recording.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to delete this recording' });
    }
    
    // Delete the file from disk
    const filePath = path.join(__dirname, '..', 'uploads', 'recordings', recording.fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete from database
    await Recording.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Recording deleted successfully' });
  } catch (error) {
    console.error('Error deleting recording:', error);
    res.status(500).json({ message: 'Failed to delete recording' });
  }
};

// Add this to expose recordings
export const downloadRecording = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find recording and verify ownership
    const recording = await Recording.findById(id);
    
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }
    
    if (recording.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to access this recording' });
    }
    
    // Get the file path
    const filePath = path.join(__dirname, '..', 'uploads', 'recordings', recording.fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Recording file not found' });
    }
    
    // Set appropriate headers
    res.setHeader('Content-Type', 'video/webm');
    res.setHeader('Content-Disposition', `attachment; filename="${recording.fileName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading recording:', error);
    res.status(500).json({ message: 'Failed to download recording' });
  }
};