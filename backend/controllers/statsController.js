// backend/controllers/statsController.js
import User from '../models/User.js';

export const getUserStats = async (req, res) => {
  try {
    const userId = req.session?.userId; // Safely access session data
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: No session found' });
    }

    const user = await User.findById(userId)
      .populate('connections.user', 'role')
      .populate('sessions.mentor sessions.mentee');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate stats
    const sessionsCompleted = user.sessions.length;
    const mentorsConnected = user.connections.filter(
      conn => conn.status === 'accepted' &&
      (conn.user.role === 'mentor' || conn.user.role === 'both')
    ).length;
    const coursesTaken = new Set(
      user.sessions.flatMap(session => session.skillsPracticed)
    ).size;
    const xpNeeded = Math.pow(user.level.levelNumber, 2) * 100;
    const progress = Math.floor((user.xpPoints / xpNeeded) * 100);

    res.status(200).json({
      sessionsCompleted,
      mentorsConnected,
      coursesTaken,
      xpPoints: user.xpPoints,
      level: user.level.levelNumber,
      progress
    });
  } catch (err) {
    console.error("Get Stats Error:", err);
    res.status(500).json({ message: "Failed to get user stats" });
  }
};