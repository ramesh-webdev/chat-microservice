const Message = require('../models/message.model');
const Conversation = require('../models/conversation.model');
const messagestatusModel = require('../models/messagestatus.model');

const PAGE_SIZE = 20;
exports.getMessages = async (req, res) => {
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
};