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
    if (!socket) return;

    const onMessageSent = ({ clientMessageId, messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.clientMessageId === clientMessageId
            ? { ...m, _id: messageId, status: "sent" }
            : m
        )
      );
    };

    socket.on("message:sent", onMessageSent);

    return () => {
      socket.off("message:sent", onMessageSent);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !activeChat?.conversationId) return;
    if (!isChatActive.current) return;

    socket.emit("conversation:read", {
      conversationId: activeChat.conversationId,
    });
  }, [messages]);

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
      useChatStore.getState().setActiveChat({
        mode: "conversation",
        conversationId,
        title: "Chat",
      });
      socket.emit("join_conversation", { conversationId });
    });
    return () => socket.off("conversation:created");
  }, [socket]);

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

    if (activeChat.mode === "conversation") {
      socket.emit("message:create", {
        conversationId: activeChat.conversationId,
        content: text,
        clientMessageId: tempId,
        attachments: msg.attachments || [],
      });
    }

    if (activeChat.mode === "user") {
      socket.emit("message:create", {
        receiverId: activeChat.userId,
        content: text,
        clientMessageId: tempId,
        attachments: msg.attachments || [],
      });
    }
  };

  if (!activeChat) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 mb-4 opacity-50">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
        <span className="text-lg">Select a chat to start messaging</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
            {(activeChat.title || "C").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-slate-800 leading-tight">
              {activeChat.title || "Chat"}
            </h2>
            {typingUserIds.length > 0 ? (
              <span className="text-xs text-indigo-500 font-medium animate-pulse">typing...</span>
            ) : (
              <span className="text-xs text-slate-500">
                {activeChat.mode === 'conversation' && membersCount > 0 ? `${membersCount} members` : 'Online'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-6 space-y-2 relative">
        {cursor && (
          <div className="text-center mb-4">
            <button
              onClick={loadOlderMessages}
              className="px-4 py-1 text-xs font-medium text-slate-500 bg-slate-200 rounded-full hover:bg-slate-300 transition-colors"
            >
              {loadingOld ? "Loading..." : "Load older messages"}
            </button>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg._id} msg={msg} />
        ))}
      </div>

      {/* Input */}
      <MessageInput onSend={sendMessage} onTyping={handleTyping} />
    </div>
  );
}
