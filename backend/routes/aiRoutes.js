// backend/routes/aiRoutes.js
import express from 'express';
import { askAI } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protection middleware to ensure only authenticated users can access the AI
router.post('/ask', protect, askAI);

export default router;