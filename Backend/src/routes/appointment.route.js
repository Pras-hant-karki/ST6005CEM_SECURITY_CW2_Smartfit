import { Router } from "express";
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

router.get("/availability", verifyAuth("patient"), checkavailability);
router.get("/", verifyAuth("patient"), getallappointmentforpatient);
router.post("/book-appointment/:doctorid", verifyAuth("patient"), createAppointment);
router.post("/cancelAppointment/:appointmentid", verifyAuth("patient"), cancelappointment);
router.patch("/updateappointment/:appointmentid", verifyAuth("patient"), updateappointment);
router.get("/:appointmentid", verifyAuth("patient"), getappointment);

export default router;