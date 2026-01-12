
import express from "express";
const router = express.Router();
import { sendOTP, verifyOTP, refresh, logout } from "../controllers/auth.controller.js";


router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/refresh", refresh);
router.post("/logout", logout);

export default router;
