const crypto = require('crypto');
const User = require('../models/User');
const sendResetEmail = require('../utils/sendResetEmail'); // Import the email utility

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'This email address is not registered.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send the reset email
    await sendResetEmail(user.email, token);

    res.json({ message: 'We have sent you an email with instructions to reset your password.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};