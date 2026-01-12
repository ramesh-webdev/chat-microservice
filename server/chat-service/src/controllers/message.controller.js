const Message = require('../models/message.model');
const Conversation = require('../models/conversation.model');
const messagestatusModel = require('../models/messagestatus.model');
const User = require('../models/user.model'); // Register User model for populate

const PAGE_SIZE = 20;
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { cursor } = req.query;
    const userId = req.user.id;
    console.log(`[getMessages] User: ${userId}, Conv: ${conversationId}, Cursor: ${cursor}`);

    // 1️⃣ Verify membership
    const conv = await Conversation.findOne({
      _id: conversationId,
      "members.userId": userId,
    });

    // If ID is invalid, mongo might throw, caught below. 
    // If ID valid but not found (or user not member):
    if (!conv) {
      console.log(`[getMessages] Access Denied or Conv Not Found`);
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

    console.log(`[getMessages] Found ${messages.length} messages`);

    let nextCursor = null;

    if (messages.length > PAGE_SIZE) {
      const last = messages.pop();
      nextCursor = last._id;
    }

    const messageIds = messages.map((m) => m._id);

    // 3️⃣ FETCH STATUSES (CRITICAL)
    const statuses = await messagestatusModel.find({
      messageId: { $in: messageIds },
    });

    // 4️⃣ MARK DELIVERED (sent → delivered for this user)
    await messagestatusModel.updateMany(
      {
        userId,
        messageId: { $in: messageIds },
        status: "sent",
      },
      { $set: { status: "delivered" } }
    );

    res.json({
      messages: messages.reverse(), // oldest → newest
      statuses,                    // 👈 REQUIRED
      nextCursor,
      membersCount: conv.members.length, // 👈 REQUIRED for tick logic
    });
  } catch (error) {
    console.error("[getMessages] Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};