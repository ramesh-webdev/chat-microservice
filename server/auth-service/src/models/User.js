
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    name: String,
    avatarUrl: String
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
