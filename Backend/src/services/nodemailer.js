import nodemailer from "nodemailer";

const createTransporter = () => {
  const user = process.env.SENDER_EMAIL || process.env.EMAIL_USER;
  const pass = process.env.APP_PASSWORD || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 7000,
    auth: {
      user,
      pass,
    },
  });
};

export default createTransporter;
