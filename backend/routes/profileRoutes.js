import express from 'express';
import { 
  upsertProfile, 
  uploadAssets, 
  getProfile, 
  endorseSkill,
  getMatches,
  getMentorsBySkill,
  getUserStats,
  updateLastActive, // Import the controller
  exploreProfiles // Import the new controller
} from '../controllers/profileController.js';
import { createRoom, joinRoom } from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js'; // Import protect middleware

const router = express.Router();

// Profile routes
router.put('/last-active', protect, updateLastActive); // Add this route

router.post('/:userId/photo', uploadAssets, upsertProfile);
router.put('/:userId', upsertProfile);
router.get('/explore', exploreProfiles); // Ensure this is defined before '/:userId'
router.get('/:userId', getProfile); // This should come after '/explore'
router.post('/endorse', endorseSkill);
router.get('/matches', getMatches);
router.get('/mentors/:skill', getMentorsBySkill);
router.get('/stats/user/:userId', getUserStats);
router.get('/stats/user', protect, getUserStats); // Ensure this route exists

// Room routes
router.post('/room/create', createRoom);
router.post('/room/join', joinRoom);

export default router;
