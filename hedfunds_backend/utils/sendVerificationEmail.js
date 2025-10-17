const nodemailer = require('nodemailer');

const sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const verificationLink = `${process.env.BACKEND_URL}/api/users/verify/${token}`;

  const mailOptions = {
    from: `SwiftFund Team <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <h1>Verify Your Email Address</h1>
      <p>Hello,</p>
      <p>Thank you for signing up with SwiftFund. Please click the button below to verify your email address:</p>
      <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; margin: 10px 0; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>If the button above does not work, you can copy and paste the following link into your browser:</p>
      <p>${verificationLink}</p>
      <br>
      <p>If you did not create this account, please ignore this email.</p>
      <p>Best regards,<br>SwiftFund Team</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendVerificationEmail;