const crypto = require("crypto");
const User = require("../models/User");
const sendVerificationEmail = require("../utils/sendVerificationEmail");
const sendResetEmail = require("../utils/sendResetEmail");

// Utility function for error handling
const handleError = (res, statusCode, message) => {
  res.status(statusCode).json({ message });
};

// REGISTER
exports.register = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return handleError(res, 400, "Email already in use");
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = new User({
      fullname,
      email: normalizedEmail,
      password,
      verificationToken,
    });

    await newUser.save();

    // ✅ Pass only the token (not full URL)
    await sendVerificationEmail(newUser.email, verificationToken);

    res.status(201).json({
      message: "Registration successful. Please check your email to verify your account.",
    });
  } catch (err) {
    console.error("Register error:", err);
    handleError(res, 500, "Internal server error");
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return handleError(res, 400, "User not found");
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return handleError(res, 400, "Invalid credentials");
    }

    if (!user.isVerified) {
      return handleError(res, 403, "Please verify your email first");
    }

    req.session.userId = user._id;

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        isVerified: user.isVerified,
        balance: user.balance,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    handleError(res, 500, "Internal server error");
  }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return handleError(res, 404, "This email address is not registered.");
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetLink = `${process.env.BASE_URL}/reset-password/${token}`;
    await sendResetEmail(user.email, resetLink);

    res.json({ message: "A reset link has been sent to your email address." });
  } catch (err) {
    console.error("Forgot password error:", err);
    handleError(res, 500, "Internal server error");
  }
};


// LOGOUT
exports.logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return handleError(res, 500, "Logout failed");
      }
      res.clearCookie("connect.sid");
      res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (err) {
    console.error("Logout error:", err);
    handleError(res, 500, "Internal server error");
  }
};