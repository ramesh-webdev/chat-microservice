
import { redis } from "../config/redis.js";

export const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

export const saveOTP = async (phone, otp) => {
  await redis.set(`otp:${phone}`, otp, { EX: 300 });
};

export const verifyOTPValue = async (phone, otpEntered) => {
  const stored = await redis.get(`otp:${phone}`);
  return stored && stored === otpEntered;
};
