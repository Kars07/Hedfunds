const express =require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, isAdmin } = require("../middleware/auth");
const { users } = require("../controller/Usercont")
router.get("admin/users", protect, isAdmin, async (requestAnimationFrame,res) => {
    const users = await User.find();
    res.json(users);
});

module.exports = router;