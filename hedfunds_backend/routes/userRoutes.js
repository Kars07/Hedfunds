const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const {
  register,
  login,
  logout,
} = require("../controller/Usercont");

const { forgotPassword } = require("../controller/forgotpassword");
const { resetPassword } = require("../controller/resetpassword");
const { handleContact } = require("../controller/contactController");
const User = require("../models/User");
const { protect } = require("../middleware/auth");

// Register
router.post(
  "/register",
  [
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  ],
  register
);

// Email Verification
router.get("/verify/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.send(`
      <html>
        <head>
          <title>Email Verified</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin-top: 50px;
              background-color: #f4f4f9;
              color: #333;
            }
            .container {
              padding: 20px;
              border: 1px solid #ccc;
              border-radius: 10px;
              display: inline-block;
              background-color: #fff;
            }
            .button {
              display: inline-block;
              padding: 10px 20px;
              margin-top: 20px;
              background-color: #007bff;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              font-size: 16px;
            }
            .button:hover {
              background-color: #0056b3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Email Verified Successfully!</h1>
            <p>Your email has been successfully verified. You can now log in to your account.</p>
            <a href="https://hedfunds.vercel.app/login" class="button">Go to Login</a>
          </div>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).json({ message: "Verification failed" });
  }
});

// Login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Invalid email address"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

// Forgot Password
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Invalid email address")],
  forgotPassword
);

// Reset Password
router.post(
  "/reset-password/:token",
  [
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
  ],
  resetPassword
);

// Protected Routes
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password -resetPasswordToken");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


//Handle Contact Submissions
router.post("/contact", handleContact);

// Logout
router.post("/logout", protect, logout);

module.exports = router;
