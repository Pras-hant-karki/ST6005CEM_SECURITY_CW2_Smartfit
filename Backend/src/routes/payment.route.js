import { Router } from "express";
import { createCheckoutSession, verifyPayment } from "../controllers/payment.controller.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create-checkout-session", verifyAuth("patient"), createCheckoutSession);
router.get("/verify", verifyAuth("patient"), verifyPayment);

export default router;
