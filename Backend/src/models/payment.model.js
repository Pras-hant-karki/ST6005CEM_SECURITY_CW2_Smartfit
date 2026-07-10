import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        required: true,
        index: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Patient",
        required: true,
        index: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: "gbp" },
    stripeSessionId: { type: String, required: true, unique: true, index: true },
    stripePaymentIntentId: { type: String, default: "" },
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
        index: true,
    },
    processedAt: { type: Date, default: null },
}, { timestamps: true });

export const Payment = mongoose.model("Payment", paymentSchema);
