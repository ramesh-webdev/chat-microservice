
import jwt from "jsonwebtoken";

export const generateRefreshToken = (payload) =>
    jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET || "refresh_secret", {
        expiresIn: "7d",
    });

export const verifyRefreshToken = (token) =>
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || "refresh_secret");

export const generateAccessToken = (payload) =>
    jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || "15m",
    });

export const verifyToken = (token) =>
    jwt.verify(token, process.env.JWT_SECRET);
