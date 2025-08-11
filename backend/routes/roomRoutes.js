import express from 'express';
import { createRoom, joinRoom, getRoom, saveRecording, getUserRecordings, deleteRecording, downloadRecording } from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';

// Configure storage for recordings
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/recordings/');
  },
  filename: function (req, file, cb) {
    cb(null, `recording-${Date.now()}-${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

const router = express.Router();

router.post('/create', protect, createRoom);
router.post('/join', protect, joinRoom);
router.get('/:id', protect, getRoom);

// Recording routes
router.post('/recordings', protect, upload.single('recording'), saveRecording);
router.get('/recordings/user', protect, getUserRecordings);
router.delete('/recordings/:id', protect, deleteRecording);
router.get('/recordings/download/:id', protect, downloadRecording);

export default router;