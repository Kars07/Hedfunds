const nodemailer = require("nodemailer");

const handleContact = async (req, res) => {
  const { fullName, email, companyName, message } = req.body;

  if (!fullName || !email || !companyName || !message) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.CONTACT_EMAIL,
        pass: process.env.CONTACT_EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"${fullName}" <${email}>`,
      to: process.env.CONTACT_RECEIVER,
      subject: `New ContactUs Message from ${companyName}`,
      html: `
        <h3>New Contact Message from SwiftFund App by ${companyName}</h3>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${companyName}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Email send error:", error);
    res.status(500).json({ message: "Failed to send message." });
  }
};

module.exports = { handleContact };
