import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MongoStore from 'connect-mongo';

// Routes imports
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Socket.io initialization
import { initializeSocket } from './controllers/roomController.js';

// Configure environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize socket.io
initializeSocket(httpServer);

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Configure session middleware
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'skillsphere-secret-key',
  resave: false,
  saveUninitialized: false, // Changed to false for development
  cookie: { 
    secure: process.env.NODE_ENV === 'production', 
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Don't use MongoDB store for local development
if (process.env.NODE_ENV === 'production') {
  try {
    sessionConfig.store = MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: 'sessions'
    });
  } catch (err) {
    console.log('Session store creation failed, using memory store');
  }
} else {
  console.log('Using memory store for sessions (development mode)');
}

app.use(session(sessionConfig));

// Serve profile pictures from uploads folder
app.use('/uploads/profiles', express.static(path.join(__dirname, 'uploads/profiles')));
app.use('/uploads/messages', express.static(path.join(__dirname, 'uploads/messages')));

// Ensure recordings directory exists and is served
import fs from 'fs';
const recordingsDir = path.join(__dirname, 'uploads/recordings');
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true });
}
app.use('/uploads/recordings', express.static(recordingsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// Log MongoDB connection info - only log in development
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'URI is defined' : 'URI is undefined');

// Database connection with error handling
const connectDB = async () => {
  try {
    // Connect to local MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ Connected to local MongoDB');
    global.dbConnected = true;
    
    // Start server after successful DB connection
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`💾 Database connected: ${global.dbConnected}`);
      console.log('🎯 MongoDB is ready! You can now signup/login normally');
    });
    
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.log('⚠️  Make sure MongoDB is running locally on port 27017');
    console.log('📝 To start MongoDB: mongod --dbpath "C:\\data\\db"');
    global.dbConnected = false;
    
    // Start server anyway for development
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`💾 Database connected: ${global.dbConnected}`);
      console.log('🔧 Development mode: Use test@test.com / test123 for login');
    });
  }
};

// Connect to database
connectDB();
