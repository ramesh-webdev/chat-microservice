
import express from "express";
const router = express.Router();
import { sendOTP, verifyOTP } from "../controllers/auth.controller.js";


router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

export default router;
