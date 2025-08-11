import express from 'express';

const router = express.Router();

// Mock notifications endpoint
router.get('/', (req, res) => {
  const notifications = [
    { id: 1, message: 'You have a new connection request', read: false },
    { id: 2, message: 'Your profile was viewed', read: true },
  ];
  res.status(200).json(notifications);
});

export default router;
