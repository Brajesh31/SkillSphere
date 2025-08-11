import Message from "../models/Message.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get directory name properly in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../uploads/messages");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

// Initialize upload middleware
export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Send a message
export const sendMessage = async (req, res) => {
  try {
    const { receiver, content } = req.body;
    const sender = req.user._id;

    const message = new Message({ sender, receiver, content });
    await message.save();

    res.status(201).json({ message: "Message sent successfully", data: message });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Failed to send message" });
  }
};

// Upload and send a file
export const sendFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { receiver } = req.body;
    const sender = req.user._id;
    const fileName = req.file.filename;
    const content = `file:${fileName}`;

    const message = new Message({ sender, receiver, content });
    await message.save();

    res.status(201).json({ 
      message: "File sent successfully", 
      data: message,
      filePath: `/uploads/messages/${fileName}`
    });
  } catch (error) {
    console.error("Error sending file:", error);
    res.status(500).json({ error: "Failed to send file" });
  }
};

// Get messages between two users
export const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { userId: otherUserId } = req.params;

    if (!otherUserId || otherUserId === "undefined") {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Mark messages as seen
export const markMessagesAsSeen = async (req, res) => {
  try {
    const userId = req.user._id;
    const { userId: otherUserId } = req.params;

    await Message.updateMany(
      { sender: otherUserId, receiver: userId, isSeen: false },
      { $set: { isSeen: true } }
    );

    res.status(200).json({ message: "Messages marked as seen" });
  } catch (error) {
    console.error("Error marking messages as seen:", error);
    res.status(500).json({ error: "Failed to mark messages as seen" });
  }
};

// Check for new messages
export const checkNewMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find unseen messages sent to the current user
    const unreadMessages = await Message.find({
      receiver: userId,
      isSeen: false
    }).distinct('sender');
    
    res.status(200).json({
      hasNewMessages: unreadMessages.length > 0,
      senders: unreadMessages
    });
  } catch (error) {
    console.error("Error checking for new messages:", error);
    res.status(500).json({ error: "Failed to check for new messages" });
  }
};

// Get unread message count from a specific user
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const { userId: otherUserId } = req.params;
    
    const count = await Message.countDocuments({
      sender: otherUserId,
      receiver: userId,
      isSeen: false
    });
    
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error counting unread messages:", error);
    res.status(500).json({ error: "Failed to count unread messages" });
  }
};
