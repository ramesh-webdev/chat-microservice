import User from "../models/User.js";
import {
  generateOTP,
  saveOTP,
  verifyOTPValue,
} from "../services/otp.service.js";
import { generateToken } from "../utils/jwt.js";

export const sendOTP = async (req, res) => {
  const { phone } = req.body;
  console.log("reached");
  if (!phone) return res.status(400).json({ message: "Phone required" });

  const otp = generateOTP();
  await saveOTP(phone, otp);

  console.log("OTP for", phone, "=>", otp);

  res.json({ message: "OTP sent" });
};

export const verifyOTP = async (req, res) => {
  const { phone, otp } = req.body;

  const isValid = await verifyOTPValue(phone, otp);
  if (!isValid) return res.status(400).json({ message: "Invalid OTP" });

  let user = await User.findOne({ phone });
  let isNew = false;

  if (!user) {
    user = await User.create({ phone });
    isNew = true;
  }

  const token = generateToken({ id: user._id });

  res.json({ token, user, isNew });
};
