
import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import Conversation from "../models/Conversation.js";
import MessageStatus from "../models/MessageStatus.js";

export default function (io) {
    io.on("connection", (socket) => {
        const token = socket.handshake.auth?.token;
        if (!token) return socket.disconnect(true);

        let payload;
        try {
            payload = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return socket.disconnect(true);
        }

        socket.user = { id: payload.id };
        socket.join(`user_${socket.user.id}`);

        /* ---------------- JOIN CONVERSATION ---------------- */
        socket.on("join_conversation", async ({ conversationId }) => {
            const conv = await Conversation.findOne({
                _id: conversationId,
                "members.userId": socket.user.id,
            });
            if (!conv) return;

            socket.join(`conv_${conversationId}`);

            const messageIdsRaw = await Message.find(
                { conversationId },
                { _id: 1 }
            ).lean();

            const ids = messageIdsRaw.map((m) => m._id);

            // 1️⃣ Find affected rows FIRST
            const affected = await MessageStatus.find({
                userId: socket.user.id,
                messageId: { $in: ids },
                status: "sent",
            }).lean();

            console.log(`[Socket] User ${socket.user.id} joined conv ${conversationId}. Affected status count: ${affected.length}`);

            // 2️⃣ Update them
            if (affected.length > 0) {
                await MessageStatus.updateMany(
                    { _id: { $in: affected.map((a) => a._id) } },
                    { $set: { status: "delivered" } }
                );

                console.log(`[Socket] Emitting status update to conv_${conversationId} for ${affected.length} messages`);

                // 3️⃣ Emit ONLY what changed
                socket.to(`conv_${conversationId}`).emit("message:status:update", {
                    updates: affected.map((a) => ({
                        messageId: a.messageId.toString(),
                        userId: a.userId.toString(),
                        status: "delivered",
                    })),
                });
            }
        });

        /* ---------------- SEND MESSAGE ---------------- */
        socket.on(
            "message:create",
            async ({ conversationId, receiverId, content, clientMessageId, attachments }) => {
                let conv;

                if (!conversationId && receiverId) {
                    conv = await Conversation.findOne({
                        type: "private",
                        "members.userId": { $all: [socket.user.id, receiverId] },
                    });

                    if (!conv) {
                        conv = await Conversation.create({
                            type: "private",
                            members: [{ userId: socket.user.id }, { userId: receiverId }],
                        });

                        socket.emit("conversation:created", { conversationId: conv._id });
                    }
                } else {
                    conv = await Conversation.findOne({
                        _id: conversationId,
                        "members.userId": socket.user.id,
                    });
                }

                if (!conv) return;

                const msg = await Message.create({
                    conversationId: conv._id,
                    senderId: socket.user.id,
                    content,
                    clientMessageId,
                    attachments: attachments || [],
                });

                const uniqueMembers = new Map();
                conv.members.forEach((m) => {
                    uniqueMembers.set(m.userId.toString(), m);
                });

                const statuses = Array.from(uniqueMembers.values()).map((m) => ({
                    messageId: msg._id,
                    userId: m.userId,
                    status: "sent",
                }));

                await MessageStatus.insertMany(statuses);

                socket.emit("message:sent", {
                    clientMessageId,
                    messageId: msg._id,
                });

                // Emit to EACH member individually so their ChatList updates
                // even if they haven't joined the conversation room.
                uniqueMembers.forEach((m) => {
                    io.to(`user_${m.userId}`).emit("message:new", msg);
                });
            }
        );

        /* ---------------- READ CONVERSATION ---------------- */
        socket.on("conversation:read", async ({ conversationId }) => {
            const messages = await Message.find(
                { conversationId },
                { _id: 1 }
            ).lean();

            const ids = messages.map((m) => m._id);

            const affected = await MessageStatus.find({
                userId: socket.user.id,
                messageId: { $in: ids },
                status: { $ne: "read" },
            }).lean();

            if (affected.length > 0) {
                await MessageStatus.updateMany(
                    { _id: { $in: affected.map((a) => a._id) } },
                    { $set: { status: "read" } }
                );

                socket.to(`conv_${conversationId}`).emit("message:status:update", {
                    updates: affected.map((a) => ({
                        messageId: a.messageId.toString(),
                        userId: a.userId.toString(),
                        status: "read",
                    })),
                });
            }
        });

        /* ---------------- TYPING ---------------- */
        socket.on("typing", async ({ conversationId, isTyping }) => {
            socket.to(`conv_${conversationId}`).emit("typing", {
                conversationId,
                userId: socket.user.id,
                isTyping,
            });
        });

        /* ---------------- REACT TO MESSAGE ---------------- */
        socket.on("message:reaction", async ({ messageId, reaction }) => {
            const msg = await Message.findById(messageId);
            if (!msg) return;

            // Remove existing reaction by this user if any
            let reactions = msg.reactions || [];
            const existingIndex = reactions.findIndex(r => r.userId.toString() === socket.user.id);

            if (existingIndex > -1) {
                // If clicking same reaction, remove it (toggle)
                if (reactions[existingIndex].emoji === reaction) {
                    reactions.splice(existingIndex, 1);
                } else {
                    // Change reaction
                    reactions[existingIndex].emoji = reaction;
                }
            } else {
                // Add new
                reactions.push({ userId: socket.user.id, emoji: reaction });
            }

            msg.reactions = reactions;
            await msg.save();

            io.to(`conv_${msg.conversationId}`).emit("message:reaction:update", {
                messageId,
                reactions
            });
        });

        /* ---------------- EDIT MESSAGE ---------------- */
        socket.on("message:edit", async ({ messageId, newContent }) => {
            const msg = await Message.findById(messageId);
            if (!msg) return;

            // 1. Check ownership
            if (msg.senderId.toString() !== socket.user.id) return;

            // 2. Check time limit (15 minutes)
            const timeDiff = Date.now() - new Date(msg.createdAt).getTime();
            if (timeDiff > 15 * 60 * 1000) {
                return;
            }

            // 3. Update
            msg.content = newContent;
            msg.isEdited = true;
            await msg.save();

            io.to(`conv_${msg.conversationId}`).emit("message:content:update", {
                messageId,
                content: newContent,
                isEdited: true
            });
        });
    });
};
