import mongoose from "mongoose";
const deptSchema = new mongoose.Schema({
    deptname: {
        type: String,
        required: true,
        index: true,
    },
    description: {
        type: String,
        required: true,
    },
    iconKey: {
        type: String,
        default: "hospital",
    },
    color: {
        type: String,
        default: "general-green",
    },
}, { timestamps: true });
export const Department = mongoose.model("Department", deptSchema);
