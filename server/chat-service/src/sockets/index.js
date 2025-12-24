const jwt = require("jsonwebtoken");
const Message = require("../models/message.model");
const Conversation = require("../models/conversation.model");
const MessageStatus = require("../models/messagestatus.model");

module.exports = function (io, redisAdapter) {
  if (redisAdapter) io.adapter(redisAdapter);

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

      const messageIds = await Message.find(
        { conversationId },
        { _id: 1 }
      ).lean();

      const ids = messageIds.map((m) => m._id);

      // 1️⃣ Find affected rows FIRST
      const affected = await MessageStatus.find({
        userId: socket.user.id,
        messageId: { $in: ids },
        status: "sent",
      }).lean();

      // 2️⃣ Update them
      if (affected.length > 0) {
        await MessageStatus.updateMany(
          { _id: { $in: affected.map((a) => a._id) } },
          { $set: { status: "delivered" } }
        );

        // 3️⃣ Emit ONLY what changed
        socket.to(`conv_${conversationId}`).emit("message:status:update", {
          updates: affected.map((a) => ({
            messageId: a.messageId,
            userId: a.userId,
            status: "delivered",
          })),
        });
      }
    });

    /* ---------------- SEND MESSAGE ---------------- */
    socket.on(
      "message:create",
      async ({ conversationId, receiverId, content, clientMessageId }) => {
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
        });

        const statuses = conv.members.map((m) => ({
          messageId: msg._id,
          userId: m.userId,
          status: "sent",
        }));

        await MessageStatus.insertMany(statuses);

        socket.emit("message:sent", {
          clientMessageId,
          messageId: msg._id,
        });

        socket.to(`conv_${conv._id}`).emit("message:new", msg);
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
            messageId: a.messageId,
            userId: a.userId,
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
  });
};
