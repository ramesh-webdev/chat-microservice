const Message = require('../models/message.model');
const Conversation = require('../models/conversation.model');

const PAGE_SIZE = 20;
exports.getMessages = async (req, res) => {
    const {
        conversationId
    } = req.params;
    const {
        cursor
    } = req.query;
    const userId = req.user.id;

    const query = {
        conversationId
    };

    // 1️⃣ Verify user is member of conversation
    const conv = await Conversation.findOne({
        _id: conversationId,
        "members.userId": userId
    });

    if (!conv) {
        return res.status(403).json({
            message: "Access denied"
        });
    }

    // Cursor-based pagination
    if (cursor) {
        const cursorMsg = await Message.findById(cursor);
        if (cursorMsg) {
            query.createdAt = {
                $lt: cursorMsg.createdAt
            };
        }
    }

    const messages = await Message.find(query)
        .sort({
            createdAt: -1
        })
        .limit(PAGE_SIZE + 1);

    let nextCursor = null;

    if (messages.length > PAGE_SIZE) {
        const last = messages.pop();
        nextCursor = last._id;
    }

    res.json({
        messages: messages.reverse(), // oldest → newest
        nextCursor
    });
};