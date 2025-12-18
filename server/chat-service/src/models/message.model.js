const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AttachmentSchema = new Schema(
  {
    mediaId: Schema.Types.ObjectId,
    url: String,
    type: String,
    name: String,
    size: Number,
  },
  { _id: false }
);

const ReactionSchema = new Schema(
  { userId: Schema.Types.ObjectId, reaction: String, reactedAt: Date },
  { _id: false }
);

const MessageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      index: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    content: { type: String, default: "" },
    clientMessageId: { type: String },
    attachments: [AttachmentSchema],
    replyTo: { type: Schema.Types.ObjectId, ref: "Message" },
    forwardedFrom: {
      userId: Schema.Types.ObjectId,
      originalMsgId: Schema.Types.ObjectId,
    },
    reactions: [ReactionSchema],
    deletedFor: [{ type: Schema.Types.ObjectId, ref: "User" }],
    expiresAt: Date,
    deliveredTo: [{ type: mongoose.Schema.Types.ObjectId }],
    readBy: [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", MessageSchema);
