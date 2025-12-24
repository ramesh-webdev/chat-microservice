const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageStatusSchema = new Schema(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  { timestamps: true }
);

// CRITICAL INDEXES
MessageStatusSchema.index({ messageId: 1, userId: 1 }, { unique: true });
MessageStatusSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("MessageStatus", MessageStatusSchema);