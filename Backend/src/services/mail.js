import createTransporter from "./nodemailer.js";

const sendMail = async ({ to, subject, html }) => {
  try {
    const transporter = createTransporter();
    const senderEmail = process.env.SENDER_EMAIL || process.env.EMAIL_USER;

    if (!transporter) {
      throw new Error("Email service is not configured. Set EMAIL_USER and EMAIL_PASS in Backend/.env.");
    }

    const info = await transporter.sendMail({
      from: senderEmail,
      to,
      subject,
      html,
    });

    console.log("📧 Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};

export default sendMail;
