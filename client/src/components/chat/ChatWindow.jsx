import { useEffect, useState, useRef } from "react";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import useSocket from "../../hooks/useSocket";
import { useChatStore } from "../../stores/chat.store";
import { fetchMessages } from "../../services/chat.api";
import { useAuthStore } from "../../stores/auth.store";

export default function ChatWindow() {
  const socket = useSocket();
  const typingTimeoutRef = useRef(null);
  const { activeChat } = useChatStore();
  const currentUserId = useAuthStore.getState().user._id;
  const [typingUsers, setTypingUsers] = useState({});

  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loadingOld, setLoadingOld] = useState(false);

  /**
   * 1️⃣ Load latest messages when conversation changes
   */
  useEffect(() => {
    if (!activeChat?.conversationId) return;

    setMessages([]);
    setCursor(null);

    fetchMessages(activeChat.conversationId)
      .then((res) => {
        const messagesWithStatus = res.data.messages.map((msg) => {
          let status = "sent";

          if (msg.readBy?.length > 0) status = "read";
          else if (msg.deliveredTo?.length > 0) status = "delivered";

          return { ...msg, status };
        });

        setMessages(messagesWithStatus);

        setCursor(res.data.nextCursor);
      })
      .catch(console.error);
  }, [activeChat]);

  useEffect(() => {
    if (!socket || !activeChat?.conversationId) return;

    socket.on("typing", ({ conversationId, userId, isTyping }) => {
      if (conversationId !== activeChat.conversationId) return;

      setTypingUsers((prev) => ({
        ...prev,
        [userId]: isTyping,
      }));
    });

    socket.on("message:delivered", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, status: "delivered" } : m
        )
      );
    });

    socket.on("message:read", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, status: "read" } : m))
      );
    });

    return () => socket.off("typing");
  }, [socket, activeChat?.conversationId]);

  const typingUserIds = Object.keys(typingUsers).filter(
    (id) => typingUsers[id]
  );

  useEffect(() => {
    if (!socket || !activeChat?.conversationId) return;

    socket.emit("conversation:read", {
      conversationId: activeChat.conversationId,
    });
  }, [activeChat?.conversationId]);

  /**
   * 2️⃣ Join / leave socket room
   */
  useEffect(() => {
    if (!socket || !activeChat?.conversationId) return;

    socket.emit("join_conversation", {
      conversationId: activeChat.conversationId,
    });

    socket.on("message:new", (msg) => {
      if (msg.conversationId !== activeChat.conversationId) return;

      setMessages((prev) => {
        const index = prev.findIndex(
          (m) => m.clientMessageId && m.clientMessageId === msg.clientMessageId
        );

        // 🔁 replace optimistic message
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = msg;
          return updated;
        }

        // 📩 normal incoming message
        return [...prev, msg];
      });
    });

    return () => {
      socket.emit("leave_conversation", {
        conversationId: activeChat.conversationId,
      });
      socket.off("message:new");
    };
  }, [socket, activeChat]);

  useEffect(() => {
    if (!socket) return;

    socket.on("conversation:created", ({ conversationId }) => {
      // switch mode
      useChatStore.getState().setActiveChat({
        mode: "conversation",
        conversationId,
        title: "Chat",
      });

      // JOIN ROOM IMMEDIATELY
      socket.emit("join_conversation", { conversationId });
    });

    return () => socket.off("conversation:created");
  }, [socket]);

  /**
   * 3️⃣ Load older messages (pagination)
   */
  const loadOlderMessages = async () => {
    if (!cursor || loadingOld) return;

    setLoadingOld(true);
    try {
      const res = await fetchMessages(activeChat.conversationId, cursor);
      setMessages((prev) => [...res.data.messages, ...prev]);
      setCursor(res.data.nextCursor);
    } finally {
      setLoadingOld(false);
    }
  };

  const handleTyping = () => {
    if (!socket || !activeChat?.conversationId) return;

    socket.emit("typing", {
      conversationId: activeChat.conversationId,
      isTyping: true,
    });

    // debounce stop typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        conversationId: activeChat.conversationId,
        isTyping: false,
      });
    }, 800);
  };

  /**
   * 4️⃣ Send message
   */
  const sendMessage = (msg) => {
    const text = msg.text;

    const tempId = "temp_" + Date.now();

    // 👇 ADD MESSAGE LOCALLY
    setMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        clientMessageId: tempId,
        conversationId: activeChat.conversationId || "pending",
        senderId: currentUserId, // will be derived properly in MessageBubble
        content: text,
        status: "sending",
        optimistic: true,
      },
    ]);

    // 👇 SEND TO BACKEND
    if (activeChat.mode === "conversation") {
      socket.emit("message:create", {
        conversationId: activeChat.conversationId,
        content: text,
        clientMessageId: tempId,
      });
    }

    if (activeChat.mode === "user") {
      socket.emit("message:create", {
        receiverId: activeChat.userId,
        content: text,
        clientMessageId: tempId,
      });
    }
  };

  if (!activeChat) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select a chat
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b font-semibold">
        {activeChat.title || "Chats"}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4">
        {cursor && (
          <button
            onClick={loadOlderMessages}
            className="text-sm text-blue-500 mb-3"
          >
            {loadingOld ? "Loading..." : "Load older messages"}
          </button>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg._id} msg={msg} />
        ))}
      </div>

      {typingUserIds.length > 0 && (
        <div className="text-sm text-gray-500 px-4 pb-2">typing...</div>
      )}
      {/* Input */}
      <MessageInput onSend={sendMessage} onTyping={handleTyping} />
    </div>
  );
}
