import { Router } from "express";
import { autoCancelExpiredAppointments } from "../controllers/cron.controller.js";

const router = Router();

// INTERNAL — see the Swagger-exclusion note on autoCancelExpiredAppointments
// in cron.controller.js.
router.get("/auto-cancel", autoCancelExpiredAppointments);

export default router;