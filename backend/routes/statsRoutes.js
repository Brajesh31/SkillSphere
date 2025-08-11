// backend/routes/statsRoutes.js
import express from 'express';
import { getUserStats } from '../controllers/statsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getUserStats);

router.get('/user', protect, async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Mock stats for now
    const stats = {
      sessionsCompleted: 5,
      mentorsConnected: 3,
      hoursLearned: 20,
      coursesTaken: 2,
    };

    res.status(200).json(stats);
  } catch (err) {
    console.error('Error fetching user stats:', err);
    res.status(500).json({ message: 'Failed to fetch user stats' });
  }
});

export default router;