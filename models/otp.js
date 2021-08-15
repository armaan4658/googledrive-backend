import mongoose from "mongoose";
const otpSchema = mongoose.Schema({
    email:{
        type: String,
        required: true
    },
    otp:{
        type: Number,
        required: true
    }
});
export const Otp = mongoose.model("otp",otpSchema);