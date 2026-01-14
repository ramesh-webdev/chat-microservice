
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import MessageStatus from '../models/MessageStatus.js';

const PAGE_SIZE = 20;

export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { cursor } = req.query;
        const userId = req.user.id;

        // 1️⃣ Verify membership
        const conv = await Conversation.findOne({
            _id: conversationId,
            "members.userId": userId,
        });

        if (!conv) {
            return res.status(403).json({ message: "Access denied" });
        }

        const query = { conversationId };

        // 2️⃣ Cursor pagination
        if (cursor) {
            const cursorMsg = await Message.findById(cursor);
            if (cursorMsg) {
                query.createdAt = { $lt: cursorMsg.createdAt };
            }
        }

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(PAGE_SIZE + 1);

        let nextCursor = null;

        if (messages.length > PAGE_SIZE) {
            const last = messages.pop();
            nextCursor = last._id;
        }

        const messageIds = messages.map((m) => m._id);

        // 3️⃣ FETCH STATUSES (CRITICAL)
        const statuses = await MessageStatus.find({
            messageId: { $in: messageIds },
        });

        // 4️⃣ MARK DELIVERED (sent → delivered for this user)
        // We update statuses where userId is CURRENT user and status is 'sent'
        // But wait - MessageStatus has {messageId, userId, status}.
        // If I received a message, there is a Status row for ME.
        // If I sent a message, there is a Status row for OTHERS? 
        // Usually MessageTable = 1 row per message.
        // MessageStatusTable = N rows per message (1 per recipient).

        // So if I am pulling messages, I want to see checks for messages I SENT. (Outgoing)
        // AND I want to mark 'delivered' messages I RECEIVED. (Incoming)
        // The previous code:
        /*
            await messagestatusModel.updateMany({
               userId,                  // My ID (as recipient)
               messageId: { $in: messageIds },
               status: "sent",
            }, { $set: { status: "delivered" } });
        */
        // This implies 'userId' in MessageStatus refers to the RECIPIENT status.
        // 4️⃣ MARK DELIVERED (sent → delivered for this user)
        // Find sent messages for this user to emit update
        const messagesToDeliver = await MessageStatus.find({
            userId,
            messageId: { $in: messageIds },
            status: "sent",
        });

        if (messagesToDeliver.length > 0) {
            await MessageStatus.updateMany(
                { _id: { $in: messagesToDeliver.map(m => m._id) } },
                { $set: { status: "delivered" } }
            );

            // Emit update via socket
            if (req.io) {
                req.io.to(`conv_${conversationId}`).emit("message:status:update", {
                    updates: messagesToDeliver.map((a) => ({
                        messageId: a.messageId.toString(),
                        userId: a.userId.toString(),
                        status: "delivered",
                    })),
                });
            }
        }

        res.json({
            messages: messages.reverse(), // oldest → newest
            statuses,
            nextCursor,
            membersCount: conv.members.length,
        });
    } catch (error) {
        console.error("[getMessages] Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
