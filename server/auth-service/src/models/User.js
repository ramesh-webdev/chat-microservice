import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  deviceId: String,
  refreshToken: String,
  lastActive: { type: Date, default: Date.now },
  expiresAt: Date,
}, { _id: false });


const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  name: { type: String },
  avatarUrl: String,
  status: String,
  sessions: [SessionSchema],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
