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

    // Convert mongoose document to object to modify array or push directly
    // 'devices' is the new field name we chose in User.js, replacing 'sessions'
    // But wait! User.js uses 'devices'.
    // auth-service used 'sessions'.
    // We need to adapt this logic to push to 'devices' instead of 'sessions'.

    // Checking User.js: devices: [DeviceSchema]
    // DeviceSchema: deviceId, refreshToken, pushTokens, lastActive, expiresAt.

    // So we map session -> device.
    // Note: pushTokens might be updated later by chat service logic, 
    // here we just init connection session.

    user.devices.push({
        deviceId: deviceId || "unknown",
        refreshToken,
        lastActive: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        pushTokens: [] // Init empty
    });

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

        // finding in 'devices'
        const device = user.devices.find(d => d.refreshToken === refreshToken);
        if (!device) return res.status(403).json({ message: "Invalid Session" });

        // Generate New Access Token
        const newAccessToken = generateAccessToken({ id: user._id });

        // Update session activity
        device.lastActive = new Date();
        await user.save();

        res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error(err);
        return res.status(403).json({ message: "Invalid Refresh Token" });
    }
};

export const logout = async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
        try {
            // Decode not strictly necessary if we search by refresh token
            // But we need to find user first. 
            // If client sends userID, great, but often just token.
            // We can iterate/find user with this token. 
            // User.findOne({'devices.refreshToken': refreshToken})

            const user = await User.findOne({ "devices.refreshToken": refreshToken });
            if (user) {
                user.devices = user.devices.filter(d => d.refreshToken !== refreshToken);
                await user.save();
            }
        } catch (e) {
            // Ignore error
        }
    }

    res.json({ message: "Logged out" });
};
