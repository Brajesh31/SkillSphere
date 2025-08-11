import express from 'express';
import {
  sendConnectionRequest,
  respondToConnection,
  getAllConnections, // Ensure this is imported
  getPendingConnections,
  searchUsers,
  markMessagesAsSeen,
  getConnectionNotifications
} from '../controllers/connectionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/connect/:targetUserId', protect, sendConnectionRequest);
router.post('/respond/:connectionId', protect, respondToConnection);
router.get('/all', protect, getAllConnections);
router.get('/pending', protect, getPendingConnections);
router.get('/search', protect, searchUsers);

router.put('/messages/mark-seen/:userId', protect, markMessagesAsSeen);

router.get('/notifications', protect, getConnectionNotifications);

export default router;