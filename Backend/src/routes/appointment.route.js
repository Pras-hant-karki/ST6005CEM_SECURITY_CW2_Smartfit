import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createAppointment,
  cancelappointment,
  updateappointment,
  getappointment,
  getallappointmentforpatient,
  checkavailability,
} from "../controllers/appointment.controller.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// Tighter than the global limiter — booking/cancelling/rescheduling is a
// sensitive write action (business logic + email + doctor-slot contention),
// not just routine read traffic.
const bookingLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 30 : 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { statusCode: 429, message: "Too many appointment requests. Please wait before trying again." },
});

router.get("/availability", verifyAuth("patient"), checkavailability);
router.get("/", verifyAuth("patient"), getallappointmentforpatient);
router.post("/book-appointment/:doctorid", bookingLimiter, verifyAuth("patient"), createAppointment);
router.post("/cancelAppointment/:appointmentid", bookingLimiter, verifyAuth("patient"), cancelappointment);
router.patch("/updateappointment/:appointmentid", bookingLimiter, verifyAuth("patient"), updateappointment);
router.get("/:appointmentid", verifyAuth("patient"), getappointment);

export default router;