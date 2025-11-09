const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, isAdmin } = require("../middleware/auth");

// GET /api/admin/users -> returns all users (mounted at /api/admin in server.js)
router.get("/users", protect, isAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;