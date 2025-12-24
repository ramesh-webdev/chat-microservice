
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, unique: true },
    name: { type: String},
    avatarUrl: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
