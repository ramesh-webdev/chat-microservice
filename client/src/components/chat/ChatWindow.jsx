import { useEffect, useState, useRef } from "react";
import { v4 as uuid } from "uuid";
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
  const isChatActive = useRef(false);
  const currentUserId = useAuthStore.getState().user._id;
  const [typingUsers, setTypingUsers] = useState({});

  const [messages, setMessages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loadingOld, setLoadingOld] = useState(false);
  const [messageStatuses, setMessageStatuses] = useState([]);
  const [membersCount, setMembersCount] = useState(0);

  function deriveStatus(message, statuses, currentUserId) {
    if (message.senderId !== currentUserId) return;

    const rows = statuses.filter((s) => s.messageId === message._id);
    const others = rows.filter((r) => r.userId !== currentUserId);

    if (others.some((r) => r.status === "read")) return "read";
    if (others.some((r) => r.status === "delivered")) return "delivered";
    return "sent";
  }

  useEffect(() => {
    if (!activeChat?.conversationId) return;

    setMessages([]);
    setCursor(null);

    fetchMessages(activeChat.conversationId)
      .then((res) => {
        setMessageStatuses(res.data.statuses);
        setMembersCount(res.data.membersCount);

        const msgs = res.data.messages.map((msg) => {
          if (msg.senderId !== currentUserId) return msg;

          return {
            ...msg,
            status: deriveStatus(msg, res.data.statuses, currentUserId),
          };
        });

        setMessages(msgs);
        setCursor(res.data.nextCursor);
      })
      .catch(console.error);
  }, [activeChat]);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.senderId !== currentUserId) return m;
        return {
          ...m,
          status: deriveStatus(m, messageStatuses, currentUserId),
        };
      })
    );
  }, [messageStatuses]);

  useEffect(() => {
    isChatActive.current = true;
    return () => {
      isChatActive.current = false;
    };
  }, [activeChat?.conversationId]);

  useEffect(() => {
    if (!socket || !activeChat?.conversationId) return;

    socket.on("typing", ({ conversationId, userId, isTyping }) => {
      if (conversationId !== activeChat.conversationId) return;

      setTypingUsers((prev) => ({
        ...prev,
        [userId]: isTyping,
      }));
    });

    socket.on("message:sent", ({ clientMessageId, messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.clientMessageId === clientMessageId
            ? { ...m, _id: messageId, status: "sent" }
            : m
        )
      );
    });

    socket.on("message:new", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("message:status:update", ({ updates }) => {
      setMessageStatuses((prev) => {
        const map = new Map(prev.map((s) => [`${s.messageId}_${s.userId}`, s]));

        updates.forEach((u) => {
          map.set(`${u.messageId}_${u.userId}`, u);
        });

        return Array.from(map.values());
      });
    });

    return () => {
      socket.off("typing");
      socket.off("message:sent");
      socket.off("message:new");
      socket.off("message:status:update");
    };
  }, [socket, activeChat?.conversationId]);

  useEffect(() => {
    setTypingUsers({});
  }, [activeChat?.conversationId]);

  const typingUserIds = Object.keys(typingUsers).filter(
    (id) => typingUsers[id]
  );

useEffect(() => {
  if (!socket || !activeChat?.conversationId) return;
  if (!isChatActive.current) return;

  socket.emit("conversation:read", {
    conversationId: activeChat.conversationId,
  });
}, [messages]);

  /**
   * 2️⃣ Join / leave socket room
   */
  useEffect(() => {
    if (!socket || !activeChat?.conversationId) return;

    socket.emit("join_conversation", {
      conversationId: activeChat.conversationId,
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

    setMessages((prev) => [
      ...prev,
      {
        _id: tempId,
        clientMessageId: tempId,
        senderId: currentUserId,
        content: text,
        status: "sending",
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
