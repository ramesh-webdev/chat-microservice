
import jwt from "jsonwebtoken";

export const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

export const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET);
