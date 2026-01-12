import User from "../models/User.js";
import {
  generateOTP,
  saveOTP,
  verifyOTPValue,
} from "../services/otp.service.js";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

export const sendOTP = async (req, res) => {
  const { phone, type } = req.body; // type: 'login' | 'signup'

  if (!phone) return res.status(400).json({ message: "Phone required" });

  const user = await User.findOne({ phone });

  if (type === "login" && !user) {
    return res.status(404).json({ message: "Account not found. Please sign up." });
  }

  if (type === "signup" && user) {
    return res.status(409).json({ message: "Account already exists. Please login." });
  }

  const otp = generateOTP();
  await saveOTP(phone, otp);

  console.log("OTP for", phone, "=>", otp);

  res.json({ message: "OTP sent" });
};

export const verifyOTP = async (req, res) => {
  const { phone, otp, deviceId, type } = req.body; // type: 'login' | 'signup'

  const isValid = await verifyOTPValue(phone, otp);
  if (!isValid) return res.status(400).json({ message: "Invalid OTP" });

  let user = await User.findOne({ phone });
  let isNew = false;

  if (type === "login" && !user) {
    return res.status(404).json({ message: "Account not found" });
  }

  if (type === "signup") {
    if (user) return res.status(409).json({ message: "Account already exists" });
    user = await User.create({ phone });
    isNew = true;
  }

  // Fallback for legacy calls or auto-create if no type provided (optional, but let's stick to strict if possible, or auto-create if type is missing for backward compatibility? No, let's enforce or default to login?)
  // If type is undefined, current code behavior was auto-create.
  // Let's assume strict for new UI, but auto-create if !type for safety? 
  // User asked for "need signup, and login", implying separation.
  if (!user && !type) {
    // Legacy behavior
    user = await User.create({ phone });
    isNew = true;
  }

  // Generate Tokens
  const accessToken = generateAccessToken({ id: user._id });
  const refreshToken = generateRefreshToken({ id: user._id });

  // Save Session
  const session = {
    deviceId: deviceId || "unknown",
    refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    lastActive: new Date()
  };

  user.sessions.push(session);
  await user.save();

  res.json({ accessToken, refreshToken, user, isNew });
};

export const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: "Refresh Token Required" });

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ message: "User not found" });

    const session = user.sessions.find(s => s.refreshToken === refreshToken);
    if (!session) return res.status(403).json({ message: "Invalid Session" });

    // Generate New Access Token
    const newAccessToken = generateAccessToken({ id: user._id });

    // Update session activity
    session.lastActive = new Date();
    await user.save();

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    return res.status(403).json({ message: "Invalid Refresh Token" });
  }
};

export const logout = async (req, res) => {
  const { refreshToken } = req.body;
  // Also accept user ID from auth middleware if we want to kill all sessions, but let's stick to specific session logout

  if (refreshToken) {
    // Remove specific session
    try {
      const decoded = verifyRefreshToken(refreshToken); // Decode without verifying signature strictly if expired? No, assume valid or just finding by token string.
      // Actually, querying by token string is better to allow logging out even if expired locally
      // But we need the User ID. Since we don't have authentication middleware on this specific public endpoint usually (or do we?),
      // let's try to decode.
      // Simplified: User must provide ID? Or we decode.
      const user = await User.findOne({ "sessions.refreshToken": refreshToken });
      if (user) {
        user.sessions = user.sessions.filter(s => s.refreshToken !== refreshToken);
        await user.save();
      }
    } catch (e) {
      // Ignore error, just cleanup
    }
  }

  res.json({ message: "Logged out" });
};
