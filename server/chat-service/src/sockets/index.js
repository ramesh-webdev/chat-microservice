const jwt = require("jsonwebtoken");
const Message = require("../models/message.model");
const Conversation = require("../models/conversation.model");

module.exports = function (io, redisAdapter) {
  // attach redis adapter if provided
  if (redisAdapter) io.adapter(redisAdapter);

  io.on("connection", (socket) => {
    // authenticate token from handshake
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) {
      socket.disconnect(true);
      return;
    }
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      socket.disconnect(true);
      return;
    }

    socket.user = {
      id: payload.id,
    };

    const userId = socket.user.id;
    socket.join(`user_${userId}`);

    socket.on("join_conversation", async ({ conversationId }) => {
      const conv = await Conversation.findOne({
        _id: conversationId,
        "members.userId": socket.user.id,
      });

      if (!conv) return;

      socket.join(`conv_${conversationId}`);

      // 1️⃣ find messages NOT YET delivered to this user
      const undelivered = await Message.find({
        conversationId,
        senderId: { $ne: socket.user.id },
        deliveredTo: { $ne: socket.user.id },
      });

      // 2️⃣ mark delivered PER MESSAGE
      for (const msg of undelivered) {
        msg.deliveredTo.push(socket.user.id);
        await msg.save();

        // 3️⃣ notify senders
        io.to(`conv_${conversationId}`).emit("message:delivered", {
          messageId: msg._id,
          userId: socket.user.id,
        });
      }
    });

    socket.on("leave_conversation", ({ conversationId }) => {
      socket.leave(`conv_${conversationId}`);
    });

    socket.on(
      "message:create",
      async ({ conversationId, content, receiverId, clientMessageId }) => {
        let conv;

        if (!conversationId && receiverId) {
          conv = await Conversation.findOne({
            type: "private",
            "members.userId": {
              $all: [socket.user.id, receiverId],
            },
          });

          if (!conv) {
            conv = await Conversation.create({
              type: "private",
              members: [
                {
                  userId: socket.user.id,
                },
                {
                  userId: receiverId,
                },
              ],
            });
          }

          socket.join(`conv_${conv._id}`);
          // notify BOTH sides
          socket.emit("conversation:created", {
            conversationId: conv._id,
          });
          io.to(`user_${receiverId}`).emit("conversation:created", {
            conversationId: conv._id,
          });
        } else {
          conv = await Conversation.findOne({
            _id: conversationId,
            "members.userId": socket.user.id,
          });

          if (!conv) return;
        }

        const msg = await Message.create({
          conversationId: conv._id,
          senderId: socket.user.id,
          content,
          clientMessageId,
          status: "sent",
        });

        conv.lastMessage = content;
        conv.updatedAt = new Date();
        await conv.save();

        io.to(`conv_${conv._id}`).emit("message:new", {
          _id: msg._id,
          conversationId: conv._id,
          senderId: msg.senderId,
          content: msg.content,
          clientMessageId,
          status: "sent",
          createdAt: msg.createdAt,
        });
      }
    );

    socket.on("conversation:read", async ({ conversationId }) => {
      const unread = await Message.find({
        conversationId,
        senderId: { $ne: socket.user.id },
        readBy: { $ne: socket.user.id },
      });

      for (const msg of unread) {
        msg.readBy.push(socket.user.id);
        await msg.save();

        io.to(`conv_${conversationId}`).emit("message:read", {
          messageId: msg._id,
          userId: socket.user.id,
        });
      }
    });

    socket.on("typing", async ({ conversationId, isTyping }) => {
      if (!conversationId) return;

      // 🔐 authorize membership
      const conv = await Conversation.findOne({
        _id: conversationId,
        "members.userId": socket.user.id,
      });

      if (!conv) return;

      // emit to everyone else in the room
      socket.to(`conv_${conversationId}`).emit("typing", {
        conversationId,
        userId: socket.user.id,
        isTyping,
      });
    });

    socket.on("disconnect", () => {
      // cleanups if needed
    });
  });
};
