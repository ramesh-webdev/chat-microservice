import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const MessageSchema = new Schema(
    {
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "Conversation",
            index: true,
            required: true,
        },
        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: String,
        clientMessageId: String,
        attachments: [],
        reactions: [],
        isEdited: { type: Boolean, default: false },
    },
    { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });

export default mongoose.model("Message", MessageSchema);
