import { Appointment } from "../models/appointment.model.js";
import sendMail from "../services/mail.js";
import { appointmentcancellation } from "../utils/emailtemplate.js";
import { asyncHandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import crypto from "crypto";

// INTERNAL — not a public API endpoint. Triggered by an external scheduler
// (see Backend/vercel.json crons) and authenticated with a shared bearer
// secret (CRON_SECRET), not a user session. Exclude from public Swagger
// documentation, or document separately under an "internal/ops" tag.
const autoCancelExpiredAppointments = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;

  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new apiError(503, "Service not configured");
  }

  // Comparing against a fixed-length expected value (rather than checking
  // `given === expected` directly) plus a timing-safe comparison prevents
  // both a length-based short-circuit and a byte-by-byte timing attack on
  // the bearer secret.
  const expected = `Bearer ${secret}`;
  const given = authHeader || "";
  if (
    given.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  ) {
    throw new apiError(401, "Unauthorized");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredAppointments = await Appointment.find({
    status: "Confirmed", appointmentdate: { $lt: today } })
    .populate("patient", "email patientname")
    .populate("doctor", "doctorname");

  if (!expiredAppointments.length) {
    return res.status(200).json(new apiResponse(200, { cancelledCount: 0 }, "No expired appointments"));
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

  return res.status(200).json(
    new apiResponse(200, { cancelledCount: expiredAppointments.length }, "Auto cancellation completed")
  );
});

export { autoCancelExpiredAppointments };