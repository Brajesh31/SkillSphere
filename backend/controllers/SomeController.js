try {
  const stats = await Session.find()
    .populate({ path: 'sessions.mentor', strictPopulate: false });
  res.status(200).json(stats);
} catch (error) {
  console.error("Error fetching stats:", error);
  res.status(500).json({ message: "Internal Server Error", error: error.message });
}