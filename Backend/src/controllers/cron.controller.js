import { Appointment } from "../models/appointment.model.js";
import sendMail from "../services/mail.js";
import { appointmentcancellation } from "../utils/emailtemplate.js";
import { asyncHandler } from "../utils/asynchandler.js";
import crypto from "crypto";

const autoCancelExpiredAppointments = asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization;

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({ message: "Service not configured" });
  }
  // guessable undefined bearer token is now rejected when secret isn't configured
  const expected = `Bearer ${secret}`;
  const given = authHeader || "";
  if (
    given.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  ) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  // used for timingSafeEqual to prevent timing attacks on the bearer token comparison
  

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredAppointments = await Appointment.find({ 
    status: "Confirmed", appointmentdate: { $lt: today } })
    .populate("patient", "email patientname")
    .populate("doctor", "doctorname");
    // fetch the real patient & doctor documents up front via .populate()

  if (!expiredAppointments.length) {
    return res.status(200).json({ message: "No expired appointments" });
  }

  await Appointment.updateMany(
    {
      status: "Confirmed",
      appointmentdate: { $lt: today },
    },
    {
      $set: {
        status: "Cancelled",
        deleteafter: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }
  );

  for (const appointment of expiredAppointments) {
    try {
      if (!appointment.patient?.email) continue;

      sendMail({
        to: appointment.patient.email,
        subject: "Appointment Auto Cancelled",
        html: appointmentcancellation(
          appointment.patient.patientname,
          appointment.doctor.doctorname,
          appointment.appointmentdate,
          appointment.appointmenttime
        ),
      });
    } catch (error) {
      console.error("Error sending cancellation email:", error);
    }
  }

  return res.status(200).json({
    message: "Auto cancellation completed",
    cancelledCount: expiredAppointments.length,
  });
});

export { autoCancelExpiredAppointments };