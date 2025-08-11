import express from "express";
import {
  sendMessage,
  getMessages,
  markMessagesAsSeen,
  checkNewMessages,
  getUnreadCount,
  sendFile,
  upload
} from "../controllers/messageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/send", protect, sendMessage);
router.post("/send-file", protect, upload.single('file'), sendFile);
router.get("/check-new", protect, checkNewMessages);
router.get("/unread-count/:userId", protect, getUnreadCount);
router.get("/:userId", protect, async (req, res, next) => {
  const { userId } = req.params;

  if (!userId || userId === "undefined") {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  next();
}, getMessages);
router.put("/mark-seen/:userId", protect, markMessagesAsSeen);

export default router;
