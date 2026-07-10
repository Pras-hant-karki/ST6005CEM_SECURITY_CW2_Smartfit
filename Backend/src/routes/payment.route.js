import { Router } from "express";
import { createCheckoutSession, verifyPayment } from "../controllers/payment.controller.js";
import { verifyAuth } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/create-checkout-session", verifyAuth, createCheckoutSession);
router.get("/verify", verifyAuth, verifyPayment);

export default router;
