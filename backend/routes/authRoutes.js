//routes/authRoutes.js
import express from 'express';
import {
  signup,
  verifyOtp,
  forgotPasswordController,
  resetPasswordController,
  loginUser,
  getDashboardData,
  logout
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/verify-otp', verifyOtp);
router.post('/login', loginUser);
router.get('/dashboard', protect, getDashboardData); // Ensure this route is protected
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);
router.post('/logout', logout);

// Add the /me endpoint to return the current user
router.get('/me', protect, (req, res) => {
  res.status(200).json(req.user);
});

export default router;
