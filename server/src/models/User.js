import mongoose from "mongoose";

const DeviceSchema = new mongoose.Schema({
    deviceId: String,
    refreshToken: String, // From Auth Service
    pushTokens: [String], // From Chat Service
    lastActive: { type: Date, default: Date.now },
    expiresAt: Date,      // From Auth Service
}, { _id: false });

const UserSchema = new mongoose.Schema({
    phone: { type: String, required: true, unique: true },
    name: { type: String },
    avatarUrl: String,
    status: String,       // "online", "offline", etc.
    devices: [DeviceSchema],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
